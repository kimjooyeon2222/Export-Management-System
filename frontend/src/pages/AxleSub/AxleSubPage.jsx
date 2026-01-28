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
  TableBody
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { apiFetch } from "api/apiFetch";
import ItemSearchDialog from "components/dialog/ItemSearchDialog";
import { useRef } from "react";




export default function AxleSubPage() {

  const axleCompanyColors = {
    "윤영테크": "#FFD966",
    "대영이엔피": "#A9D18E",
    "신우신": "#9BC2E6"
  };
  const [deletedAxleIds, setDeletedAxleIds] = useState([]);

  const [selectedRowIds, setSelectedRowIds] = useState([]);

  const axleCompanyColorMap = useRef({});
  const usedAxleCompanyColors = useRef(
    new Set(Object.values(axleCompanyColors))
  );

  const getCompanyColor = (company) => {
    if (!company) return null;

    // 1️⃣ 기존 업체 색상은 그대로
    if (axleCompanyColors[company]) {
      return axleCompanyColors[company];
    }

    // 2️⃣ 이미 생성된 신규 업체 색상 재사용
    if (axleCompanyColorMap.current[company]) {
      return axleCompanyColorMap.current[company];
    }

    // 3️⃣ 신규 업체 색 생성 (Axle 톤 유지 + 충돌 방지)
    let hash = 0;
    for (let i = 0; i < company.length; i++) {
      hash = company.charCodeAt(i) + ((hash << 5) - hash);
    }

    let hue = Math.abs(hash) % 360;
    let color;

    do {
      // ⭐ Axle 기존 색과 어울리는 엑셀톤
      color = `hsl(${hue}, 50%, 72%)`;
      hue = (hue + 23) % 360; // ⭐ 조금씩 이동하면서 충돌 회피
    } while (usedAxleCompanyColors.current.has(color));

    // 4️⃣ 캐시 + 사용 색 등록
    usedAxleCompanyColors.current.add(color);
    axleCompanyColorMap.current[company] = color;

    return color;
  };


  const [scheduleRows, setScheduleRows] = useState([]); // 🔥 운송 스케줄

  const [axleRows, setAxleRows] = useState([]);
  const companyGroups = React.useMemo(() => {
    const map = new Map();

    axleRows.forEach(r => {
      if (!r.company) return;
      if (!map.has(r.company)) {
        map.set(r.company, []);
      }
      map.get(r.company).push(r);
    });

    return Array.from(map.entries());
    // [ [companyName, rows[]], ... ]
  }, [axleRows]);

  const axleItemSignature = axleRows
    .map(r => r.item_code)
    .join("|");
  useEffect(() => {
    if (!scheduleRows.length || !axleRows.length) return;

    let cancelled = false;

    (async () => {
      const refreshed = await Promise.all(
        scheduleRows.map(async (row) => {
          if (!row.inv_no) return row;

          const quantities = await loadRowQuantities(row.inv_no);

          return {
            ...row,
            quantities,        // ⭐ qty 재계산
            _hydrated: false,  // ⭐ 기존 hydrate 무효화
          };
        })
      );

      if (!cancelled) {
        setScheduleRows(refreshed);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [axleItemSignature]);

  const invoiceCache = useRef({});
  const qtyCache = useRef({});

  async function hydrateRowByInv(row) {
    if (!row.inv_no) return row;


    try {
      let invoice = invoiceCache.current[row.inv_no];
      if (!invoice) {
        const res = await apiFetch(`${API_BASE}/api/invoice/${row.inv_no}`);
        invoice = await res.json();
        invoiceCache.current[row.inv_no] = invoice;
      }

      const etdDate = invoice?.etd ? parseKRDate(invoice.etd) : null;
      const etaDate = invoice?.eta ? parseUSDate(invoice.eta) : null;
      const today = todayUS();
      const cacheKey = row.inv_no;


      let quantities = qtyCache.current[cacheKey];
      if (!quantities) {
        quantities = await loadRowQuantities(row.inv_no);
        qtyCache.current[cacheKey] = quantities;
      }

      let status = "";
      if (!etaDate) status = "부산항 미입고";
      else if (etaDate <= today) status = "입고완료";
      else if (etdDate && etdDate > today) status = "선적대기중";
      else status = "운항중";



      return {
        ...row,
        etd: invoice.etd,
        eta: invoice.eta,
        quantities,
        _hydrated: true
      };
    } catch (e) {
      console.error("❌ Axle hydrate 실패:", row.inv_no, e);
      return row;
    }
  }

  async function loadRowQuantities(inv_no) {
    if (!axleRows.length) return {};

    const quantities = {};

    for (const r of axleRows) {
      if (!r.item_code) continue;

      quantities[r.item_code] = await fetchInvItemQty(
        inv_no,
        r.item_code
      );
    }

    return quantities;
  }


  async function fetchInvItemQty(inv_no, itemCode) {
    const res = await apiFetch(`${API_BASE}/api/forging/inv-item-qty`, {
      method: "POST",
      body: JSON.stringify({
        inv_no,
        item_code: itemCode,
      }),
    });

    if (!res.ok) return 0;

    const text = await res.text();
    if (!text) return 0;

    const data = JSON.parse(text);
    return Number(data.qty || 0);
  }

  const getKoreanMonthLabel = (dateStr) => {
    if (!dateStr) return "실사재고";
    const d = new Date(dateStr);
    const year = d.getFullYear() % 100;
    const month = d.getMonth() + 1;
    return `${year}년 ${month}월 실사재고`;
  };

  const handleSelectItem = async (item) => {
    if (!targetRowId) return;

    let updated = axleRows.map(r =>
      r.tempId === targetRowId
        ? {
          ...r,
          item_code: item.item_no,
          item_name: item.item_name,
          company: item.company_name || r.company,
        }
        : r
    );

    // 🔥 1️⃣ 업체 기준 재정렬
    const map = new Map();

    updated.forEach(r => {
      const key = r.company || "__EMPTY__";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });

    updated = Array.from(map.values()).flat();

    // 🔥 2️⃣ 실사 반영
    updated = await applyAxleAuditToRowsPure(updated);

    setAxleRows(updated);

    setItemDialogOpen(false);
    setTargetRowId(null);
  };



  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [targetRowId, setTargetRowId] = useState(null);

  const getAxleJudgeStyle = (status) => {
    switch (status) {
      case "초과":
        return {
          bgcolor: "#fff2cc",     // 🔄 연노랑
          color: "#7f6000",       // 🔄 갈색
          fontWeight: "bold",
          borderRadius: "6px",
          px: 1.2,
          display: "inline-block"
        };
      case "양호":
        return {
          bgcolor: "#d9ead3",     // 연연두 배경
          color: "#274e13",       // 짙은 초록 글씨
          fontWeight: "bold",
          borderRadius: "6px",
          px: 1.2,
          display: "inline-block"
        };
      case "위험":
        return {
          bgcolor: "#f4cccc",     // 연분홍 배경
          color: "#990000",       // 진빨강 글씨
          fontWeight: "bold",
          borderRadius: "6px",
          px: 1.2,
          display: "inline-block"
        };
      case "적정재고미달":
        return {
          bgcolor: "#ead1dc",     // 🔄 연보라
          color: "#99004d",       // 🔄 진보라
          fontWeight: "bold",
          borderRadius: "6px",
          px: 1.2,
          display: "inline-block"
        };
      default:
        return {
          bgcolor: "#eeeeee",
          color: "#000",
          fontWeight: "bold",
          borderRadius: "6px",
          px: 1.2,
          display: "inline-block"
        };
    }
  };

  // 배경색 HEX → 글자색 자동 결정 (흰색/검정)
  const getContrastTextColor = (bgColor) => {
    if (!bgColor) return "#000";

    const r = parseInt(bgColor.substr(1, 2), 16);
    const g = parseInt(bgColor.substr(3, 2), 16);
    const b = parseInt(bgColor.substr(5, 2), 16);

    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    return yiq >= 128 ? "#000" : "#fff";  // 밝으면 검정, 어두우면 흰색
  };

  const axleCompanyGroups = [
    { name: "윤영테크", range: [0, 1] }, // PLUG, GASKET
    { name: "대영이엔피", range: [2, 2] }, // DOWEL PIN
    { name: "신우신", range: [3, 3] }     // PLATE
  ];


  /* ----------------------------------
    🔹 날짜 변환 (ETD/ETA 표준화)
---------------------------------- */

  // 🔸 한국 날짜를 "한국 00:00" 기준 UTC로 변환 (ETD용)
  function parseKRDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, -9, 0, 0));  // 한국 00시 고정
  }



  // 🔸 미국 날짜를 "미국 00:00" 기준 UTC로 변환 (ETA용)
  function parseUSDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 6, 0, 0));   // Chicago UTC-6 → +6 적용
  }

  // 🔸 "지금" 기준으로 미국 Alabama 날짜 00:00 만들기
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

  const API_BASE = import.meta.env.VITE_API_URL;




  const getScheduleStatus = (etd, eta) => {
    const today = todayUS();   // 미국 Alabama 기준 00:00

    const etdKR = etd ? parseKRDate(etd) : null;   // 한국시간
    const etaUS = eta ? parseUSDate(eta) : null;   // 미국시간

    if (etaUS && etaUS <= today) return "입고완료";
    if (!eta || eta === "일정 없음") return "부산항 미입고";
    if (etdKR && etdKR > today) return "선적대기중";

    return "운항중";
  };

  // 🔥 운항중 수량 계산 (오늘 날짜 기준)
  const calcInTransit = (itemCode) => {
    if (!Array.isArray(scheduleRows)) return 0;

    return scheduleRows
      .filter(r => getScheduleStatus(r.etd, r.eta) === "운항중")
      .reduce(
        (sum, r) => sum + (Number(r.quantities?.[itemCode]) || 0),
        0
      );
  };





  const updateScheduleCell = (tempId, field, value) => {
    setScheduleRows(prev =>
      Array.isArray(prev)
        ? prev.map(row =>
          row.tempId === tempId ? { ...row, [field]: value } : row
        )
        : []
    );
  };





  // ★ 엑셀 수식 =IF(F6>=F4*1.13,"초과", ...)
  const getStatus = (actual, target) => {
    if (actual >= target * 1.13) return "초과";
    if (actual >= target && actual > target * 0.96) return "양호";
    if (actual <= target * 0.7) return "위험";
    return "적정재고미달";
  };



  useEffect(() => {
    if (!scheduleRows.length || !axleRows.length) return;

    let cancelled = false;

    (async () => {
      const hydrated = await Promise.all(
        scheduleRows.map(r => hydrateRowByInv(r))
      );
      if (!cancelled) setScheduleRows(hydrated);
    })();

    return () => { cancelled = true; };
  }, [scheduleRows.length, axleRows.length]);




  const fetchScheduleData = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/axle-schedule`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("❌ axle-schedule 응답 배열 아님:", data);
        setScheduleRows([]);
        return [];
      }

      const withIds = data.map(r => ({
        ...r,
        tempId: uuidv4(),
        id: r.id
      }));

      setScheduleRows(withIds);
      return withIds;
    } catch (err) {
      console.error("AXLE 스케줄 로드 오류:", err);
      setScheduleRows([]);
      return [];
    }
  };


  const applyAxleAuditToRowsPure = async (rows) => {
    if (!usDate || !rows.length) return rows;

    const res = await apiFetch(
      `${API_BASE}/api/stock-audit/axle/by-date/${usDate}`
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

  const navigate = useNavigate();

  // 수정모드 ON/OFF
  const [editMode, setEditMode] = useState(false);

  // 작성자/날짜
  const [writer, setWriter] = useState("");
  const [usDate, setUsDate] = useState("");

  // AXLE 재고 목록

  // 과부족 패널 ON/OFF
  const [showStockPanel, setShowStockPanel] = useState(false);

  // 북미 날짜 표시 포맷
  const getPeriod = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();

    if (day <= 10) return `${month}월 초`;
    if (day <= 20) return `${month}월 중순`;
    return `${month}월 말`;
  };

  useEffect(() => {
    if (!usDate || axleRows.length === 0) return;

    (async () => {
      const hydrated = await applyAxleAuditToRowsPure(axleRows);
      setAxleRows(hydrated);
    })();
  }, [usDate]);

  // ===============================
  // 🔥  AXLE 재고 데이터 불러오기
  // ===============================

  const fetchAxleData = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/axle`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("❌ axle 응답이 배열 아님:", data);
        setAxleRows([]);
        return;
      }

      setAxleRows(
        data.map(r => ({
          ...r,
          tempId: uuidv4(),   // ⭐ 추가
          _isNew: false
        }))
      );

    } catch (err) {
      console.error("AXLE 데이터 로드 오류:", err);
      setAxleRows([]);
    }
  };



  useEffect(() => {
    fetchAxleData();
    fetchScheduleData(); // 추가!
  }, []);

  // ===============================
  // 🔥  AXLE 항목 저장
  // ===============================
  // ⭐ 저장 함수
  const saveAxleData = async () => {
    try {
      // 0️⃣ AXLE SETTING
      await apiFetch(`${API_BASE}/api/axle-setting`, {
        method: "PUT",
        body: JSON.stringify({
          writer,
          us_date: usDate,
        }),
      });

      // 🔥 1️⃣ 삭제 먼저 처리
      for (const id of deletedAxleIds) {
        const res = await apiFetch(`${API_BASE}/api/axle/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error(`AXLE 삭제 실패: ${id}`);
        }
      }


      // 🔥 2️⃣ 삭제 목록 초기화
      setDeletedAxleIds([]);

      // 3️⃣ AXLE 저장 (POST / PUT)
      for (let row of axleRows) {
        const cleanRow = { ...row };

        delete cleanRow.box_qty;
        delete cleanRow.actual_stock;
        delete cleanRow.target_stock;
        delete cleanRow.updated_at;
        delete cleanRow._isNew;
        delete cleanRow.tempId;

        if (row._isNew) {
          const res = await apiFetch(`${API_BASE}/api/axle`, {
            method: "POST",
            body: JSON.stringify(cleanRow),
          });
          const saved = await res.json();
          row.id = saved.id;
          row._isNew = false;
        } else {
          await apiFetch(`${API_BASE}/api/axle/${row.id}`, {
            method: "PUT",
            body: JSON.stringify(cleanRow),
          });
        }
      }

      // 4️⃣ 스케줄 bulk 저장
      await apiFetch(`${API_BASE}/api/axle-schedule/bulk`, {
        method: "POST",
        body: JSON.stringify(scheduleRows),
      });

      alert("저장 완료!");
      setEditMode(false);



    } catch (err) {
      console.error("저장 오류:", err);
      alert("저장 실패!");
    }
  };


  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`${API_BASE}/api/axle-setting`);
        const data = await res.json();

        if (!data) return;

        setWriter(data.writer || "");
        setUsDate(data.us_date || "");
      } catch (e) {
        console.error("axle setting load error", e);
      }
    })();
  }, []);






  return (
    <Box sx={{ p: 3 }}>

      {/* ◀ 메인으로 */}
      <Box sx={{ mb: -4 }}>
        <Button
          variant="outlined"
          onClick={() => navigate("/dashboard/default")}
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

      {/* 수정모드 + 저장버튼 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={() => setEditMode(!editMode)}
          sx={{
            borderColor: editMode ? "#d32f2f" : "#1976d2",
            color: editMode ? "#d32f2f" : "#1976d2",
            fontWeight: "bold"
          }}
        >
          {editMode ? "수정모드 종료" : "수정모드 활성화"}
        </Button>

        <Button
          variant="contained"
          disabled={!editMode}
          onClick={saveAxleData}
        >
          저장
        </Button>
      </Box>

      {/* 작성자 + 날짜 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}>
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
                textAlign: "center"
              }
            }
          }}
          InputLabelProps={{
            shrink: true,
            sx: { fontSize: "15px", fontWeight: "bold" }
          }}
          onChange={e => editMode && setWriter(e.target.value)}
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
                textAlign: "center"
              }
            }
          }}
          InputLabelProps={{
            shrink: true,
            sx: { fontSize: "15px", fontWeight: "bold" }
          }}
          onChange={e => editMode && setUsDate(e.target.value)}
          sx={{ width: 150 }}
        />

      </Box>

      {/* 제목 + 과부족 토글 */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" sx={{ fontSize: 18, fontWeight: "bold" }}>
          AXLE 서브조립품 운송일정 관리
          {usDate ? ` (${getPeriod(usDate)})` : ""}
        </Typography>

        <Button
          size="small"
          variant="outlined"
          onClick={() => setShowStockPanel(!showStockPanel)}
          sx={{
            fontSize: 14, fontWeight: "bold", mb: -1,
            mt: 2,
          }}
        >
          {showStockPanel ? "− 접기" : "+ 과부족 상태표 보기"}
        </Button>
      </Box>

      {/* ===============================
          과부족 상태표
      =============================== */}
      {showStockPanel && (
        <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
          <Box sx={{ display: "flex", mb: 2, gap: 3 }}>
            <Typography sx={{ fontWeight: "bold", fontSize: 18, mb: 1 }}>
              ※ 과부족 상태 ※
            </Typography>


          </Box>


          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1, gap: 1 }}>
            <Button
              variant="contained"
              color="success"
              size="small"
              disabled={!editMode}
              onClick={() =>
                setAxleRows(prev => [
                  ...prev,
                  {
                    id: null,
                    tempId: uuidv4(),
                    _isNew: true,          // ⭐ 신규 플래그
                    item_code: "",
                    item_name: "",
                    company: "",
                    box_qty: 0,
                    actual_stock: 0,
                    target_stock: 0,
                  }
                ])
              }
            >
              + 품목추가
            </Button>

            <Button
              variant="contained"
              color="error"
              size="small"
              disabled={!editMode}
              onClick={() => {
                // ✅ 아무 것도 선택 안 했을 때
                if (selectedRowIds.length === 0) {
                  alert("삭제할 행을 선택해주세요.");
                  return;
                }

                setAxleRows(prev => {
                  const toDelete = prev.filter(r =>
                    selectedRowIds.includes(r.tempId)
                  );

                  // 🔥 DB에 있는 행만 삭제 목록에 기록
                  toDelete.forEach(r => {
                    if (r.id) {
                      setDeletedAxleIds(ids => [...ids, r.id]);
                    }
                  });

                  // 🔥 선택된 행 전부 제거
                  return prev.filter(r =>
                    !selectedRowIds.includes(r.tempId)
                  );
                });

                // 선택 초기화
                setSelectedRowIds([]);
              }}

            >
              - 품목삭제
            </Button>


          </Box>

          <Table size="small" sx={{ "& *": { fontWeight: "bold" } }}>

            <TableHead sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000" }}>
              <TableRow>
                <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>업체명</TableCell>
                <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>품번</TableCell>
                <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>품명</TableCell>
                <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>박스 입수량</TableCell>
                <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>{getKoreanMonthLabel(usDate)}</TableCell>
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
              {axleRows.map((row) => {
                const inTransit = calcInTransit(row.item_code);

                const existing = row.actual_stock;                // 기존재고
                const total = inTransit + existing;               // 총합
                const target = Number(row.target_stock || 0);


                const judge = getStatus(existing, target);
                return (

                  <TableRow
                    key={row.id ?? row.tempId}
                    onClick={() => {
                      if (!editMode) return;

                      setSelectedRowIds(prev =>
                        prev.includes(row.tempId)
                          ? prev.filter(id => id !== row.tempId)   // 이미 선택 → 해제
                          : [...prev, row.tempId]                  // 미선택 → 추가
                      );
                    }}
                    sx={{
                      cursor: editMode ? "pointer" : "default",
                      backgroundColor:
                        selectedRowIds.includes(row.tempId)
                          ? "#ddeeff"           // ⭐ 다중 선택 강조
                          : judge === "적정재고미달"
                            ? "#faeeee"
                            : "inherit"

                    }}
                  >


                    <TableCell
                      align="center"
                      onClick={(e) => {
                        e.stopPropagation();          // ⭐ 추가
                        if (!editMode) return;
                        setTargetRowId(row.tempId);
                        setItemDialogOpen(true);
                      }}
                    >

                      {editMode ? (
                        <TextField
                          size="small"
                          value={row.company}
                          placeholder="업체 선택"
                          InputProps={{
                            readOnly: true,
                          }}
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
                            py: 0.4,
                            borderRadius: "6px",
                            fontWeight: "bold",
                            fontSize: "15px",
                            bgcolor: getCompanyColor(row.company) || "#ddd",
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
                        e.stopPropagation();          // ⭐ 추가
                        if (!editMode) return;
                        setTargetRowId(row.tempId);
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
                      onClick={(e) => {
                        e.stopPropagation();          // ⭐ 추가
                        if (!editMode) return;
                        setTargetRowId(row.tempId);
                        setItemDialogOpen(true);
                      }}
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

                    <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>{formatNumber(row.box_qty)}</TableCell>

                    {/* 실사자료 */}
                    <TableCell
                      align="center"
                      sx={{ fontSize: "15px", fontWeight: "bold" }}
                    >
                      {formatNumber(row.actual_stock)}
                    </TableCell>


                    {/* 적정재고 */}
                    <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>{formatNumber(target)}</TableCell>

                    {/* 🔥 운항중 → 여기 수정됨 */}
                    <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>{formatNumber(inTransit)}</TableCell>



                    {/* 🔥 운항중 + 기존재고 */}
                    <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>{formatNumber(total)}</TableCell>

                    {/* 판단결과 */}
                    <TableCell align="center">
                      <Box sx={getAxleJudgeStyle(judge)}>
                        {judge}
                      </Box>
                    </TableCell>

                  </TableRow>
                );
              })}

            </TableBody>
          </Table>
        </Paper>

      )}


      {/* 운송 스케줄 */}
      <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>

        <Typography sx={{ fontWeight: "bold", fontSize: 18, mb: 2 }}>
          ※ 운송 스케줄 현황 ※
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1, gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            size="small"
            disabled={!editMode}
            onClick={() =>
              setScheduleRows(prev => [
                ...prev,
                {
                  tempId: uuidv4(),
                  id: null,
                  inv_no: "",
                  etd: "",
                  eta: "",
                  quantities: {}   // 🔥 qty는 전부 여기
                }

                // ★ inv_no 빈값 금지
              ])
            }

          >
            + 행추가
          </Button>

          <Button
            variant="contained"
            color="error"
            size="small"
            disabled={!editMode}
            onClick={() => {
              if (scheduleRows.length === 0) return;

              const lastTempId = scheduleRows[scheduleRows.length - 1].tempId;
              setScheduleRows(prev => prev.filter(r => r.tempId !== lastTempId));
            }}




          >
            - 행삭제
          </Button>
        </Box>
        <Table
          size="small"
          sx={{
            mt: 2,
            position: "relative",
            borderCollapse: "collapse",
            borderSpacing: 0,
            borderTop: "2px solid #000",   // ⭐⭐⭐ 여기 추가

            /* 기본 border 제거는 border-top만 없애야 함 */
            "& th, & td": {
              borderTop: "0 !important",
              padding: "10px 12px !important",
              verticalAlign: "middle",
            },

            /* 행×행 경계선은 여기서 추가 */
            "& td": {
              borderBottom: "1px solid #e0e0e0 !important",
            },

            "& th": {
              borderBottom: "1px solid #e0e0e0 !important",
              fontWeight: "bold !important",
            },
            "& tr": {
              minHeight: "48px",                 // ⭐ 과부족 표와 동일
            },

            /* 업체 헤더라면(첫 thead 줄) 위쪽 선 아예 제거 */
            "& thead tr:first-of-type th": {
              borderTop: "0 !important",
              borderBottom: "1px solid #b7b7b7 !important",
            }
          }}
        >


          {/* 상단 border 완전 차단용 오버레이 */}
          <Box
            sx={{
              position: "absolute",
              top: "-2px",          // ⭐ border 위까지 덮기
              left: 0,
              width: "100%",
              height: "6px",        // ⭐ 충분히 크게
              bgcolor: "#ffffff",
              zIndex: 30,           // ⭐ 헤더보다 확실히 위
              pointerEvents: "none",
            }}
          />


          <TableHead>
            <TableRow
              sx={{
                bgcolor: "#ffffff !important",
                borderTop: "0 !important",  // ⭐ 추가
              }}
            >

              <TableCell colSpan={4} />

              {companyGroups.map(([company, rows]) => {
                const bg = getCompanyColor(company);

                return (
                  <TableCell
                    key={company}
                    align="center"
                    colSpan={rows.length}   // ⭐ 중요
                    sx={{
                      fontWeight: "bold",
                      fontSize: "16px",
                      bgcolor: bg || "#ddd",
                      color: "#000",
                      borderBottom: "2px solid #b7b7b7"
                    }}
                  >
                    {company}
                  </TableCell>
                );
              })}
            </TableRow>



            {/* 🔥 기존 품명 헤더 — 네가 준 코드 그대로 유지 */}
            <TableRow sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000" }}>
              <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>INV#</TableCell>
              <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>ETD</TableCell>
              <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>ETA</TableCell>
              <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>상태</TableCell>
              {companyGroups.flatMap(([_, rows]) =>
                rows.map(r => (
                  <TableCell
                    key={r.item_code}
                    align="center"
                    sx={{ fontSize: "15px", fontWeight: "bold" }}
                  >
                    {r.item_name}
                  </TableCell>
                ))
              )}


            </TableRow>

          </TableHead>



          <TableBody>
            {scheduleRows.map(row => (
              <TableRow key={row.tempId}>


                {/* INV 번호 입력 */}
                <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
                  {editMode ? (
                    <TextField
                      size="small"
                      value={row.inv_no}
                      onChange={async (e) => {
                        const inv = e.target.value.trim();

                        updateScheduleCell(row.tempId, "inv_no", inv);

                        // 1) PACKING LIST 수량 불러오기
                        const quantities = await loadRowQuantities(inv);
                        updateScheduleCell(row.tempId, "quantities", quantities);




                        // 2) INVOICE에서 ETD/ETA 불러오기 (🔥 status는 안씀!)
                        try {
                          const res = await apiFetch(`${API_BASE}/api/invoice/${inv}`);
                          const ship = await res.json();

                          if (!ship.error) {
                            updateScheduleCell(row.tempId, "etd", ship.etd || "");
                            updateScheduleCell(row.tempId, "eta", ship.eta || "");
                          }
                        } catch (err) {
                          console.error("ETD/ETA 불러오기 오류:", err);
                        }
                      }
                      }

                    />
                  ) : (
                    row.inv_no
                  )}
                </TableCell>



                {/* ETD */}
                <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>

                  {row.etd}

                </TableCell>

                {/* ETA */}
                {/* ETA */}
                {/* ETA */}
                <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
                  {getScheduleStatus(row.etd, row.eta) === "운항중" ? (
                    <Box sx={getForgingStatusStyle("운항중")}>
                      {row.eta}
                    </Box>
                  ) : (
                    row.eta
                  )}
                </TableCell>




                {/* 상태 */}
                <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
                  <Box sx={getForgingStatusStyle(getScheduleStatus(row.etd, row.eta))}>
                    {getScheduleStatus(row.etd, row.eta)}
                  </Box>
                </TableCell>



                {/* 수량들 */}
                {companyGroups.flatMap(([_, rows]) =>
                  rows.map(it => (
                    <TableCell
                      key={it.item_code}
                      align="center"
                      sx={{ fontSize: "15px", fontWeight: "bold" }}
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
      <ItemSearchDialog
        open={itemDialogOpen}
        onClose={() => {
          setItemDialogOpen(false);
          setTargetRowId(null);
        }}
        onSelect={handleSelectItem}
      />
    </Box>
  );
}
