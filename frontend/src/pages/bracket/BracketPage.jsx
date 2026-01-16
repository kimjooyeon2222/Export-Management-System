// src/pages/bracket/BracketPage.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "api/apiFetch";
import UnitSearchDialog from "components/dialog/UnitSearchDialog";
import { useRef } from "react";

export default function BracketPage() {
  const API_BASE = import.meta.env.VITE_API_URL;
  const getKoreanMonthLabel = (dateStr) => {
    if (!dateStr) return "실사재고";

    const d = new Date(dateStr);
    const year = d.getFullYear() % 100;
    const month = d.getMonth() + 1;

    return `${year}년 ${month}월 실사재고`;
  };

  const applyBrAuditToRowsPure = async (rows) => {
    if (!usDate || !rows.length) return rows;

    const res = await apiFetch(
      `${API_BASE}/api/stock-audit/bracket/by-date/${usDate}`
    );
    const audits = await res.json();

    const auditMap = {};
    audits.forEach(a => {
      auditMap[a.item_no] = a;
    });

    return rows.map(r => {
      const audit = auditMap[r.item_code];
      if (!audit) return r;

      return {
        ...r,
        actual_stock: Number(audit.audit_qty || 0),
        target_stock: Number(audit.optimal_qty || 0),
        box_qty: Number(audit.box_qty || r.box_qty || 0),
      };
    });
  };

  async function loadBracketRowQuantities(inv_no) {
    if (!inv_no) return {};
    if (!bracketRows.length) return null;

    // ✅ cache hit
    if (qtyCache.current[inv_no]) {
      return qtyCache.current[inv_no];
    }

    // ✅ INV 기준 1번만 호출
    const res = await apiFetch(`${API_BASE}/api/br/auto-load/${inv_no}`);
    if (!res.ok) return {};

    const data = await res.json(); // { qty_map }

    const quantities = {};
    for (const r of bracketRows) {
      if (!r.item_code) continue;
      quantities[r.item_code] = Number(data.qty_map?.[r.item_code] || 0);
    }

    // ✅ 빈 객체 캐시 금지
    if (Object.keys(quantities).length > 0) {
      qtyCache.current[inv_no] = quantities;
    }

    return quantities;
  }


  const qtyCache = useRef({});

  const [scheduleRows, setScheduleRows] = useState([]);

  const scheduleInvSignature = scheduleRows
    .map(r => r.inv_no)
    .join("|");

  const [bracketRows, setBracketRows] = useState([]);
  const bracketItemSignature = bracketRows
    .map(r => r.item_code)
    .join("|");



  useEffect(() => {
    qtyCache.current = {};
  }, [bracketItemSignature]);




  // 🔥 삭제 선택 모드
  const [deleteMode, setDeleteMode] = useState(false);

  // 🔥 선택된 품목 (row id)
  const [selectedBrRowIds, setSelectedBrRowIds] = useState([]);

  const bracketCompanyColors = {
    "디케이메탈": "#FFD966",
  };
  const companyColorMap = useRef({});
  const usedCompanyColors = useRef(
    new Set(Object.values(bracketCompanyColors))
  );

  const getBracketCompanyColor = (company) => {
    if (!company) return "#ddd";

    // 1️⃣ 기존 고정 색상
    if (bracketCompanyColors[company]) {
      return bracketCompanyColors[company];
    }

    // 2️⃣ 이미 생성된 색상
    if (companyColorMap.current[company]) {
      return companyColorMap.current[company];
    }

    // 3️⃣ 신규 업체 → 이름 기반 해시
    let hash = 0;
    for (let i = 0; i < company.length; i++) {
      hash = company.charCodeAt(i) + ((hash << 5) - hash);
    }

    let hue = Math.abs(hash) % 360;
    let color;

    // ⭐ 이미 쓰는 색상이랑 절대 안 겹치게
    do {
      color = `hsl(${hue}, 60%, 78%)`;
      hue = (hue + 37) % 360;
    } while (usedCompanyColors.current.has(color));

    usedCompanyColors.current.add(color);
    companyColorMap.current[company] = color;

    return color;
  };
  const openBracketItemDialog = (e, rowId) => {
    e.stopPropagation();
    if (!editMode) return;
    setTargetBrRowId(rowId);
    setItemDialogOpen(true);
  };

  const handleSelectBracketItem = async (item) => {
    if (!targetBrRowId) return;

    let updated = bracketRows.map(r =>
      r.tempId === targetBrRowId
        ? {
          ...r,
          company: item.company_name || "",
          item_code: item.item_no,
          item_name: item.item_name,
        }
        : r
    );


    // ⭐ 실사 즉시 반영 (핵심)
    updated = await applyBrAuditToRowsPure(updated);

    setBracketRows(updated);
    setItemDialogOpen(false);
    setTargetBrRowId(null);
  };


  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [targetBrRowId, setTargetBrRowId] = useState(null);

  const [showStockPanel, setShowStockPanel] = useState(false);





  // 🔥 페이지 로딩 시 DB에서 데이터 불러오기
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL;

    async function loadAll() {
      try {
        // 1) BRACKET 세팅 불러오기
        const settingRes = await apiFetch(`${API_BASE}/api/br-setting`);
        const setting = await settingRes.json();
        if (setting) {
          setWriter(setting.writer || "");
          setUsDate(setting.us_date || "");
          setTargetStock(setting.target_stock || 0);
        }


        // 2) BRACKET 인벤토리 불러오기
        const invRes = await apiFetch(`${API_BASE}/api/br-inventory`);
        const inv = await invRes.json();
        if (Array.isArray(inv)) {
          setBracketRows(inv.map(row => ({
            ...row,
            tempId: row.tempId ?? uuidv4(),  // ⭐ 핵심
          })));



        }


        // 3) 스케줄 불러오기
        // 3) BRACKET 스케줄 불러오기 + qty 자동 적용
        const schRes = await apiFetch(`${API_BASE}/api/br-schedule`);
        const schedule = await schRes.json();

        const baseRows = schedule.map(row => ({
          tempId: uuidv4(),
          ...row,
          quantities: {},
        }));

        // 🔥 inv_no 기준으로 ETD / ETA / qty 다시 불러오기
        const hydrated = await Promise.all(
          baseRows.map(async (row) => {
            if (!row.inv_no) return row;

            // 1️⃣ qty 로딩
            const quantities = await loadBracketRowQuantities(row.inv_no);

            // 2️⃣ ETD / ETA 로딩
            let etd = row.etd;
            let eta = row.eta;

            try {
              const res = await apiFetch(`${API_BASE}/api/invoice/${row.inv_no}`);
              const ship = await res.json();

              if (!ship?.error) {
                etd = ship.etd || "";
                eta = ship.eta || "";
              }
            } catch (e) {
              console.error("hydrate invoice error:", e);
            }

            return {
              ...row,
              etd,
              eta,
              quantities,
            };
          })
        );

        // ✅ 여기서 딱 한 번 set
        setScheduleRows(hydrated);




      } catch (err) {
        console.error("🚨 로딩 오류:", err);
      }
    }


    loadAll();
  }, []);

  useEffect(() => {
    if (!bracketRows.length || !scheduleRows.length) return;

    (async () => {
      const recalculated = await Promise.all(
        scheduleRows.map(async r => {
          if (!r.inv_no) return r;

          const quantities = await loadBracketRowQuantities(r.inv_no);
          return { ...r, quantities };
        })
      );

      setScheduleRows(recalculated);
    })();
  }, [bracketItemSignature, scheduleInvSignature]);


  // ⭐ 전체 저장 함수
  const handleSave = async () => {
    if (!editMode) return;

    try {
      const API_BASE = import.meta.env.VITE_API_URL;

      // 1) BRACKET 세팅 저장 (작성자 / 날짜 / 적정재고)
      await apiFetch(`${API_BASE}/api/br-setting`, {
        method: "PUT",
        body: JSON.stringify({
          writer,
          us_date: usDate,
          target_stock: targetStock,
        }),
      });

      // 2) 각 품목(actual_stock) 저장
      // 2) BRACKET 품목 저장 (신규/기존 분기)
      for (const row of bracketRows) {
        if (row.id) {
          // ✅ 기존 데이터 → PUT
          await apiFetch(`${API_BASE}/api/br-inventory/${row.id}`, {
            method: "PUT",
            body: JSON.stringify({
              company: row.company,
              item_code: row.item_code,
              item_name: row.item_name,
              actual_stock: row.actual_stock,


            }),
          });
        } else {
          // ✅ 신규 데이터 → POST
          const res = await apiFetch(`${API_BASE}/api/br-inventory`, {
            method: "POST",
            body: JSON.stringify({
              company: row.company,
              item_code: row.item_code,
              item_name: row.item_name,
              actual_stock: row.actual_stock,
            }),
          });

          const saved = await res.json();

          setBracketRows(prev =>
            prev.map(r =>
              r.tempId === row.tempId
                ? { ...r, id: saved.id }
                : r
            )
          );
        }
      }


      // 3) 스케줄 저장
      const schedulePayload = scheduleRows.map((row) => ({
        inv_no: row.inv_no,
      }));

      await apiFetch(`${API_BASE}/api/br-schedule/bulk`, {
        method: "POST",
        body: JSON.stringify(schedulePayload),
      });

      alert("저장 완료!");
      setEditMode(false);

    } catch (err) {
      console.error("🚨 저장 오류:", err);
      alert("저장 중 오류 발생");
    }
  };

  // ★ 판단결과 박스 스타일 (AxleSub 동일)
  const getStatusBoxStyle = (status) => {
    const map = {
      // 🔁 서로 교체
      "초과": {
        bg: "#FCE5CD",   // 기존 적정재고미달 색
        color: "#B45F06",
      },
      "적정재고미달": {
        bg: "#EAD1DC",   // 기존 초과 색
        color: "#741B47",
      },

      "양호": {
        bg: "#D9EAD3",
        color: "#38761D",
      },
      "위험": {
        bg: "#F4CCCC",
        color: "#990000",
      },
    };

    const s = map[status] || { bg: "#eee", color: "#333" };

    return {
      display: "inline-block",
      padding: "3px 8px",
      borderRadius: "6px",
      fontWeight: "bold",
      fontSize: "15px",
      backgroundColor: s.bg,
      color: s.color,
    };
  };




  const getPeriod = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    if (day <= 10) return `${m}월 초`;
    if (day <= 20) return `${m}월 중순`;
    return `${m}월 말`;
  };
  const navigate = useNavigate();

  /* ----------------------------------
        공통 유틸
  ---------------------------------- */

  const getContrastTextColor = (bgColor) => {
    if (!bgColor) return "#000";
    const r = parseInt(bgColor.substr(1, 2), 16);
    const g = parseInt(bgColor.substr(3, 2), 16);
    const b = parseInt(bgColor.substr(5, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000" : "#fff";
  };

  function parseKRDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, -9, 0, 0));
  }

  function parseUSDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 6, 0, 0));
  }

  function todayUS() {
    const nowUS = new Date().toLocaleString("en-US", {
      timeZone: "America/Chicago",
    });
    const d = new Date(nowUS);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const getForgingStatusStyle = (status) => {
    if (status === "입고완료") {
      return {
        bgcolor: "#d9f7be",
        color: "#237804",
        fontWeight: "bold",
        borderRadius: "6px",
        px: 1,
        display: "inline-block",
      };
    }
    if (status === "운항중") {
      return {
        bgcolor: "#ffe6f1",
        color: "#c41d7f",
        fontWeight: "bold",
        borderRadius: "6px",
        px: 1,
        display: "inline-block",
      };
    }
    if (status === "선적대기중") {
      return {
        bgcolor: "#d0e0e3",
        color: "#0b5394",
        fontWeight: "bold",
        borderRadius: "6px",
        px: 1,
        display: "inline-block",
      };
    }
    return {
      bgcolor: "#f4cccc",
      color: "#990000",
      fontWeight: "bold",
      borderRadius: "6px",
      px: 1,
      display: "inline-block",
    };
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return Number(num).toLocaleString();
  };

  const getScheduleStatus = (etd, eta) => {
    const today = todayUS();
    const etdKR = etd ? parseKRDate(etd) : null;
    const etaUS = eta ? parseUSDate(eta) : null;

    if (etaUS && etaUS <= today) return "입고완료";
    if (!eta || eta === "일정 없음") return "부산항 미입고";
    if (etdKR && etdKR > today) return "선적대기중";

    return "운항중";
  };

  /* ----------------------------------
        상태 관리
  ---------------------------------- */

  const [editMode, setEditMode] = useState(false);
  const [writer, setWriter] = useState("");
  const [usDate, setUsDate] = useState("");

  const [targetStock, setTargetStock] = useState(0);


  useEffect(() => {
    if (!usDate || bracketRows.length === 0) return;

    (async () => {
      const hydrated = await applyBrAuditToRowsPure(bracketRows);
      setBracketRows(hydrated);
    })();
  }, [usDate, bracketRows.length]);

  // 🔥 BRACKET 업체별 그룹 (AxleSub 로직 그대로)
  const bracketCompanyGroups = React.useMemo(() => {
    const map = new Map();

    bracketRows.forEach(r => {
      if (!r.company || !r.item_code) return;

      if (!map.has(r.company)) {
        map.set(r.company, []);
      }
      map.get(r.company).push(r);
    });

    return Array.from(map.entries());
    // [ [companyName, rows[]], ... ]
  }, [bracketRows]);




  const getStatus = (actual, target) => {
    if (actual >= target * 1.13) return "초과";
    if (actual >= target && actual > target * 0.96) return "양호";
    if (actual <= target * 0.7) return "위험";
    return "적정재고미달";
  };

  const statusColor = (status) => {
    switch (status) {
      case "초과":
        return "purple";
      case "양호":
        return "green";
      case "위험":
        return "red";
      case "적정재고미달":
        return "orange";
      default:
        return "black";
    }
  };

  /* ----------------------------------
        운항 스케줄
  ---------------------------------- */



  const addRow = () => {
    setScheduleRows(prev => [
      ...prev,
      {
        tempId: uuidv4(),
        inv_no: "",
        etd: "",
        eta: "",
        quantities: {},   // ⭐ 핵심 변경
      },
    ]);
  };


  const deleteRow = () => {
    if (scheduleRows.length === 0) return;
    const last = scheduleRows[scheduleRows.length - 1].tempId;
    setScheduleRows((prev) => prev.filter((r) => r.tempId !== last));
  };

  const updateScheduleCell = (tempId, field, value) => {
    setScheduleRows((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, [field]: value } : row))
    );
  };

  /* ----------------------------------
        UI 렌더링
  ---------------------------------- */

  return (
    <Box sx={{ p: 3 }}>
      {/* 메인으로 */}
      <Box sx={{ mb: -4 }}>
        <Button
          variant="outlined"
          onClick={() => navigate("/")}
          sx={{
            borderColor: "#0069a6ff",
            color: "#0056a6ff",
            backgroundColor: "#ffffff",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "#ecfeffff",
              borderColor: "#0069a6ff",
              color: "#0085a6ff",
            },
          }}
        >
          ← 메인으로
        </Button>
      </Box>

      {/* 수정모드 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={() => setEditMode(!editMode)}
          sx={{
            borderColor: editMode ? "#d32f2f" : "#1976d2",
            color: editMode ? "#d32f2f" : "#1976d2",
            fontWeight: "bold",
          }}
        >
          {editMode ? "수정모드 종료" : "수정모드 활성화"}
        </Button>

        <Button
          variant="contained"
          disabled={!editMode}
          onClick={handleSave}
        >
          저장
        </Button>
      </Box>

      {/* 작성자 + 날짜 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 3 }}>
        <TextField
          label="작성자"
          size="small"
          value={writer}
          InputProps={{
            readOnly: !editMode,
            sx: {
              "& input": {
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
              },
            },
          }}
          InputLabelProps={{ shrink: true, sx: { fontSize: "15px", fontWeight: "bold" } }}
          onChange={(e) => editMode && setWriter(e.target.value)}
          sx={{ width: 130 }}
        />

        <TextField
          label="북미 기준 날짜 (YYYY-MM-DD)"
          size="small"
          value={usDate}
          InputProps={{
            readOnly: !editMode,
            sx: {
              "& input": {
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
              },
            },
          }}
          InputLabelProps={{ shrink: true, sx: { fontSize: "15px", fontWeight: "bold" } }}
          onChange={(e) => editMode && setUsDate(e.target.value)}
          sx={{ width: 170 }}
        />
      </Box>

      {/* 제목 */}
      {/* 제목 + 과부족 접기 버튼 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontSize: 18, fontWeight: "bold" }}>
          BRACKET 재고 및 운송 스케줄 관리
          {usDate ? ` (${getPeriod(usDate)})` : ""}
        </Typography>

        <Button
          size="small"
          variant="outlined"
          onClick={() => setShowStockPanel(!showStockPanel)}
          sx={{ fontSize: 14, fontWeight: "bold" }}
        >
          {showStockPanel ? "− 과부족 상태 접기" : "+ 과부족 상태표 보기"}
        </Button>
      </Box>


      {/* =========================================
          과부족 상태표
          
      ========================================= */}
      {showStockPanel && (

        <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography sx={{ fontWeight: "bold", fontSize: 18 }}>
              ※ 과부족 상태 ※
            </Typography>

            {editMode && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => {
                    const newRow = {
                      id: null,              // ⭐ DB id는 null
                      tempId: uuidv4(),      // ⭐ 프론트 식별자
                      company: "",
                      item_code: "",
                      item_name: "",
                      actual_stock: 0,
                      target_stock: targetStock,
                    };

                    setBracketRows(prev => [...prev, newRow]);
                  }}
                >
                  + 품목추가
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={async () => {
                    // 1️⃣ 삭제 모드 진입
                    if (!deleteMode) {
                      setDeleteMode(true);
                      setSelectedBrRowIds([]);
                      return;
                    }

                    // 2️⃣ 삭제 모드인데 선택 안 함 → alert
                    if (selectedBrRowIds.length === 0) {
                      alert("삭제할 행을 선택하세요.");
                      return;
                    }

                    // 3️⃣ DB 삭제 (id 있는 것만)
                    for (const tempId of selectedBrRowIds) {
                      const row = bracketRows.find(r => r.tempId === tempId);
                      if (row?.id) {
                        await apiFetch(`${API_BASE}/api/br-inventory/${row.id}`, {
                          method: "DELETE",
                        });
                      }
                    }

                    // 4️⃣ 프론트 삭제
                    setBracketRows(prev =>
                      prev.filter(r => !selectedBrRowIds.includes(r.tempId))
                    );


                    // 5️⃣ 초기화
                    setSelectedBrRowIds([]);
                    setDeleteMode(false);
                  }}
                >
                  {deleteMode ? "선택 삭제" : "- 품목삭제"}
                </Button>

              </Box>
            )}
          </Box>


          <Table size="small" sx={{ "& *": { fontWeight: "bold", fontSize: "15px" } }}>
            <TableHead sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000" }}>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>업체명</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>품번</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>품명</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                  {getKoreanMonthLabel(usDate)}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
                  <Box sx={{ lineHeight: 1.2 }}>
                    적정재고
                    <Typography
                      component="div"
                      sx={{
                        fontSize: "13px",
                        fontWeight: "bold",
                        color: "#555",
                      }}
                    >
                      (3개월)
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
                  <Box
                    sx={{
                      display: "inline-block",
                      ...getForgingStatusStyle("운항중"),
                    }}
                  >
                    운항중
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
                  <Box
                    component="span"
                    sx={{
                      display: "inline-block",
                      ...getForgingStatusStyle("운항중"),
                      mr: 0.5,   // pill과 텍스트 사이 간격
                    }}
                  >
                    운항중
                  </Box>
                  + 실사재고
                </TableCell>

                <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
                  <Box sx={{ lineHeight: 1.2 }}>
                    판단결과
                    <Typography
                      component="div"
                      sx={{
                        fontSize: "13px",
                        fontWeight: "bold",
                        color: "#555",
                      }}
                    >
                      (실사재고 기준)
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>


            <TableBody>
              {bracketRows.map((row) => {
                const actual = Number(row.actual_stock || 0);
                const target = Number(row.target_stock || 0);

                const inTransit = scheduleRows
                  .filter(r => getScheduleStatus(r.etd, r.eta) === "운항중")
                  .reduce(
                    (sum, r) => sum + (r.quantities?.[row.item_code] || 0),
                    0
                  );


                // ⭐ 운항중 + 실사자료
                const total = actual + inTransit;

                // ⭐ 판단결과는 total 기준
                const status = getStatus(total, target);

                return (
                  <TableRow
                    key={row.id ?? row.tempId}
                    onClick={() => {
                      if (!editMode) return;

                      setSelectedBrRowIds(prev =>
                        prev.includes(row.tempId)
                          ? prev.filter(id => id !== row.tempId)   // 이미 선택 → 해제
                          : [...prev, row.tempId]                  // 미선택 → 추가
                      );
                    }}
                    sx={{
                      cursor: editMode ? "pointer" : "default",
                      backgroundColor: selectedBrRowIds.includes(row.tempId)
                        ? "#ddeeff"          // ⭐ 선택 강조 (AxleSub 동일)
                        : status === "적정재고미달"
                          ? "#fbeaea"
                          : "inherit",
                    }}
                  >


                    <TableCell
                      align="center"
                      onClick={(e) => openBracketItemDialog(e, row.tempId)}
                    >
                      {editMode ? (
                        <TextField
                          size="small"
                          value={row.company}
                          placeholder="업체 선택"
                          InputProps={{ readOnly: true }}
                          sx={{
                            width: "100%",
                            "& input": {
                              textAlign: "center",
                              fontWeight: "bold",
                              cursor: "pointer",
                            },
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            display: "inline-block",
                            px: 1.5,
                            py: 0.3,
                            borderRadius: "6px",
                            fontWeight: "bold",
                            bgcolor: getBracketCompanyColor(row.company),

                            color: "#000",
                            minWidth: "90px",
                            textAlign: "center",
                          }}
                        >
                          {row.company}
                        </Box>
                      )}
                    </TableCell>



                    <TableCell
                      align="center"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!editMode) return;
                        setTargetBrRowId(row.tempId);
                        setItemDialogOpen(true);
                      }}
                    >
                      {editMode ? (
                        <TextField
                          size="small"
                          value={row.item_code}
                          placeholder="품번 선택"
                          InputProps={{ readOnly: true }}
                          sx={{
                            width: "100%",
                            "& input": {
                              textAlign: "center",
                              fontWeight: "bold",
                              cursor: "pointer",
                            },
                          }}
                        />
                      ) : (
                        <Typography sx={{ fontWeight: "bold" }}>
                          {row.item_code}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell
                      align="center"
                      onClick={(e) => openBracketItemDialog(e, row.tempId)}
                    >
                      {editMode ? (
                        <TextField
                          size="small"
                          value={row.item_name}
                          placeholder="품목 선택"
                          InputProps={{ readOnly: true }}
                          sx={{
                            width: "100%",
                            "& input": {
                              textAlign: "center",
                              fontWeight: "bold",
                              cursor: "pointer",
                            },
                          }}
                        />
                      ) : (
                        <Typography sx={{ fontWeight: "bold" }}>
                          {row.item_name}
                        </Typography>
                      )}
                    </TableCell>


                    {/* 실사자료 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{formatNumber(actual)}</TableCell>

                    {/* 적정재고 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{formatNumber(target)}</TableCell>

                    {/* ⭐ 운항중 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{formatNumber(inTransit)}</TableCell>

                    {/* ⭐ 운항중 + 실사자료 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{formatNumber(total)}</TableCell>

                    {/* ⭐ 판단결과 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      <Box sx={getStatusBoxStyle(status)}>{status}</Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>

          </Table>
        </Paper>
      )}

      {/* =========================================
          운항 스케줄
      ========================================= */}
      <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
        <Typography sx={{ fontWeight: "bold", fontSize: 18, mb: 2 }}>
          ※ 운송 스케줄 현황 ※
        </Typography>

        {editMode && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={addRow}
            >
              + 행추가
            </Button>

            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={deleteRow}
            >
              - 행삭제
            </Button>
          </Box>
        )}


        <Table size="small" sx={{ mt: 2, position: "relative", }}>
          {/* 🔥 상단 border 차단용 오버레이 */}
          <Box
            sx={{
              position: "absolute",
              top: "-2px",        // ⭐ border 시작점까지 덮기
              left: 0,
              width: "100%",
              height: "6px",      // ⭐ zoom 오차 대비
              bgcolor: "#ffffff",
              zIndex: 30,
              pointerEvents: "none",
            }}
          />

          <TableHead
            sx={{
              "& tr:first-of-type th": {
                borderTop: "0 !important",
              },
            }}
          >


            {/* 🔥 1행: 업체별 헤더 (동적 생성) */}
            <TableRow sx={{ bgcolor: "#ffffff !important" }}>
              <TableCell colSpan={4} />

              {bracketCompanyGroups.map(([company, rows]) => (
                <TableCell
                  key={company}
                  align="center"
                  colSpan={rows.length}   // ⭐ 품목 수만큼
                  sx={{
                    fontWeight: "bold",
                    fontSize: "16px",
                    bgcolor: getBracketCompanyColor(company),
                    color: "#000",
                    borderBottom: "2px solid #b7b7b7",
                  }}
                >
                  {company}
                </TableCell>
              ))}
            </TableRow>


            {/* 🔥 2행: 기존 품명 헤더 */}
            <TableRow sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000" }}>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                INV#
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                ETD
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                ETA
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                상태
              </TableCell>
              {bracketCompanyGroups.flatMap(([_, rows]) =>
                rows.map(r => (
                  <TableCell
                    key={r.item_code}
                    align="center"
                    sx={{ fontWeight: "bold", fontSize: "15px" }}
                  >
                    {r.item_name}
                  </TableCell>
                ))
              )}

            </TableRow>

          </TableHead>


          <TableBody>
            {scheduleRows.map((row) => (
              <TableRow key={row.tempId}>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                  {editMode ? (
                    <TextField
                      size="small"
                      value={row.inv_no}
                      onChange={async (e) => {
                        const inv = e.target.value.trim();

                        // 1️⃣ inv_no 반영
                        updateScheduleCell(row.tempId, "inv_no", inv);

                        if (!inv) {
                          updateScheduleCell(row.tempId, "quantities", {});
                          return;
                        }

                        // 2️⃣ 🔥 qty 즉시 로딩 (AxleSub와 동일)
                        const quantities = await loadBracketRowQuantities(inv);
                        updateScheduleCell(row.tempId, "quantities", quantities);


                        // 3️⃣ ETD / ETA 로딩
                        try {
                          const res = await apiFetch(`${API_BASE}/api/invoice/${inv}`);
                          const ship = await res.json();

                          if (!ship?.error) {
                            updateScheduleCell(row.tempId, "etd", ship.etd || "");
                            updateScheduleCell(row.tempId, "eta", ship.eta || "");
                          }
                        } catch (err) {
                          console.error("ETD/ETA load error:", err);
                        }
                      }}
                      sx={{ width: 90 }}
                    />

                  ) : (
                    row.inv_no
                  )}
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{row.etd}</TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                  {getScheduleStatus(row.etd, row.eta) === "운항중" ? (
                    <Box sx={getForgingStatusStyle("운항중")}>{row.eta}</Box>
                  ) : (
                    row.eta
                  )}
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                  <Box sx={getForgingStatusStyle(getScheduleStatus(row.etd, row.eta))}>
                    {getScheduleStatus(row.etd, row.eta)}
                  </Box>
                </TableCell>

                {bracketCompanyGroups.flatMap(([_, rows]) =>
                  rows.map(it => (
                    <TableCell
                      key={it.item_code}
                      align="center"
                      sx={{ fontWeight: "bold", fontSize: "15px" }}
                    >
                      {formatNumber(
                        row.quantities?.[it.item_code] || 0

                      )}
                    </TableCell>
                  ))
                )}

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <UnitSearchDialog
        open={itemDialogOpen}
        onClose={() => {
          setItemDialogOpen(false);
          setTargetBrRowId(null);
        }}
        onSelect={handleSelectBracketItem}
      />

    </Box>
  );
}