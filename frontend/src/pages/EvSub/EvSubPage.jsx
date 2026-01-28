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
  Tooltip
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "api/apiFetch";
import { v4 as uuidv4 } from "uuid";
import UnitSearchDialog from "components/dialog/UnitSearchDialog";
import { useRef } from "react";


export default function EvSubPage() {
  // 🔥 EV 재고실사 → 박스입수량 / 실사재고 / 적정재고 연동
  const applyEvAuditToRowsPure = async (rows) => {
    if (!usDate || !rows.length) return rows;

    const res = await apiFetch(
      `${API_BASE}/api/stock-audit/ev/by-date/${usDate}`
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


  // 업체별 헤더 색상 (이미지 기반 정확한 색상)
  const companyColors = {
    "금강기업": "#D64545",
    "동일인더스트리": "#ED7D31",
    "삼성금속": "#FFD966",
    "와이엠": "#A9D18E",
    "유신정밀공업": "#9BC2E6",
    "화승알엔에이": "#74A8D4",
    "평화산업": "#B4A7D6",
    "풍성아이엔디": "#D5A6BD",
    "대일 CST": "#A64D79"
  };


  const [inventoryRows, setInventoryRows] = useState([]);

  const handleToggleEditMode = () => {
    setEditMode(prev => !prev);
  };


  const companyColorMap = useRef({});

  const usedCompanyColors = useRef(new Set(Object.values(companyColors)));

  const getCompanyColor = (company) => {
    if (!company) return null;

    // 1️⃣ 기존 업체는 고정 색
    if (companyColors[company]) {
      return companyColors[company];
    }

    // 2️⃣ 이미 생성된 신규 업체 색
    if (companyColorMap.current[company]) {
      return companyColorMap.current[company];
    }

    // 3️⃣ 신규 업체 → 절대 안 겹치게 생성
    let hash = 0;
    for (let i = 0; i < company.length; i++) {
      hash = company.charCodeAt(i) + ((hash << 5) - hash);
    }

    let hue = Math.abs(hash) % 360;
    let color;

    do {
      color = `hsl(${hue}, 60%, 78%)`;
      hue = (hue + 31) % 360; // ⭐ 계속 이동
    } while (usedCompanyColors.current.has(color));

    usedCompanyColors.current.add(color);
    companyColorMap.current[company] = color;

    return color;
  };

  const getKoreanMonthLabel = (dateStr) => {
    if (!dateStr) return "실사재고"; // 날짜 없으면 기본값
    const d = new Date(dateStr);
    const year = d.getFullYear() % 100;
    const month = d.getMonth() + 1;
    return `${year}년 ${month}월 실사재고`;
  };

  const handleSelectEvItem = (item) => {
    if (!targetEvRowId) return;

    setInventoryRows(prev => {
      let updated = prev.map(r =>
        r.tempId === targetEvRowId
          ? {
            ...r,
            company: item.company_name || "",
            item_code: item.item_no,
            item_name: item.item_name,
          }
          : r
      );

      // 회사 기준 정렬
      const map = new Map();
      updated.forEach(r => {
        const key = r.company || "__EMPTY__";
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(r);
      });

      updated = Array.from(map.values()).flat();

      // seq 재부여
      return updated.map((r, idx) => ({
        ...r,
        seq: idx + 1,
      }));
    });

    // schedule qty 슬롯 유지 (기존 그대로)
    setScheduleRows(prev =>
      prev.map(row => ({
        ...row,
        quantities: {
          ...row.quantities,
          [item.item_no]: row.quantities?.[item.item_no] ?? 0,
        },
      }))
    );

    setItemDialogOpen(false);
    setTargetEvRowId(null);
  };




  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [targetEvRowId, setTargetEvRowId] = useState(null);

  // 🔥 삭제 선택 모드
  const [deleteMode, setDeleteMode] = useState(false);



  // 🔥 선택된 행 (삭제용)
  const [selectedEvRowIds, setSelectedEvRowIds] = useState([]);

  const getStockStatusStyle = (status) => {
    switch (status) {
      case "초과":
        // 🔄 원래 적정재고미달 색상
        return {
          bgcolor: "#fff2cc",   // 연노랑
          color: "#7f6000",     // 갈색
          fontWeight: "bold",
          px: 1.2,
          borderRadius: "6px"
        };

      case "양호":
        return {
          bgcolor: "#d9ead3",
          color: "#274e13",
          fontWeight: "bold",
          px: 1.2,
          borderRadius: "6px"
        };

      case "위험":
        return {
          bgcolor: "#f4cccc",
          color: "#990000",
          fontWeight: "bold",
          px: 1.2,
          borderRadius: "6px"
        };

      case "적정재고미달":
        // 🔄 원래 초과 색상
        return {
          bgcolor: "#ead1dc",   // 연보라
          color: "#99004d",     // 진보라
          fontWeight: "bold",
          px: 1.2,
          borderRadius: "6px"
        };

      default:
        return {
          bgcolor: "#eeeeee",
          color: "#000",
          fontWeight: "bold",
          px: 1.2,
          borderRadius: "6px"
        };
    }
  };




  // ==========================================
  // 🔥 EV 운항중 qty 합계 계산
  // ==========================================
  // 🔥 scheduleRows 안에 item_code 기준 qty 합산
  const calcInTransitEV = (itemCode) => {
    if (!itemCode) return 0;

    return scheduleRows
      .filter(r => getScheduleStatus(r.etd, r.eta) === "운항중")
      .reduce((sum, r) => {
        return sum + (Number(r.quantities?.[itemCode]) || 0);
      }, 0);
  };



  const getContrastTextColor = (bgColor) => {
    if (!bgColor) return "#000";

    // 배경 HEX → RGB 변환
    const r = parseInt(bgColor.substr(1, 2), 16);
    const g = parseInt(bgColor.substr(3, 2), 16);
    const b = parseInt(bgColor.substr(5, 2), 16);

    // YIQ 대비 계산
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    return yiq >= 128 ? "#000" : "#fff"; // 밝으면 검정, 어두우면 흰색
  };


  // ============================
  // 운송 스케줄 계산
  // ============================
  const getScheduleStatus = (etd, eta) => {
    const today = todayUS(); // 미국 00시 기준

    const etdKR = etd ? parseKRDate(etd) : null;
    const etaUS = eta ? parseUSDate(eta) : null;

    // ETA <= today → 입고완료
    if (etaUS && etaUS <= today) return "입고완료";

    // ETA 없음 → 부산항 미입고
    if (!eta || eta === "일정 없음") return "부산항 미입고";

    // ETD > today → 선적대기중
    if (etdKR && etdKR > today) return "선적대기중";

    // 그 외 → 운항중
    return "운항중";
  };

  const handleInvAutoLoad = async (tempId, inv) => {
    if (!inv) return;

    try {
      // 1) Invoice 정보
      const resInv = await apiFetch(`${API_BASE}/api/invoice/${inv}`);
      const invData = await resInv.json();
      if (invData.error) return;

      const etd = invData.etd || "";
      const eta = invData.eta || "";
      const status = getScheduleStatus(etd, eta);

      // 2) 통합 API
      const resFull = await apiFetch(`${API_BASE}/api/ev/packing-full/${inv}`);
      const fullData = await resFull.json();
      if (fullData.error) return;

      const qty_map = fullData.qty_map || {};

      const normalize = (v) =>
        (v || "").toString().trim().replace(/\s+/g, "").toUpperCase();

      // 3) qty 맵핑
      const newQuantities = {};

      inventoryRows.forEach(item => {
        newQuantities[item.item_code] = qty_map[item.item_code] || 0;

      });

      // ✅ quantities 반드시 저장
      setScheduleRows(prev =>
        prev.map(r =>
          r.tempId === tempId
            ? { ...r, etd, eta, status, quantities: newQuantities }
            : r
        )
      );


    } catch (err) {
      console.error("INV 자동로드 실패:", err);
    }
  };


  const saveSchedule = async () => {
    try {
      // 1️⃣ EV Setting
      await apiFetch(`${API_BASE}/api/ev-setting`, {
        method: "PUT",
        body: JSON.stringify({
          writer,
          us_date: usDate,
        }),
      });

      // 2️⃣ 🔥 EV Inventory (과부족 상태표)
      await apiFetch(`${API_BASE}/api/ev-inventory/bulk`, {
        method: "POST",
        body: JSON.stringify(
          inventoryRows.map(r => ({
            company: r.company,
            item_code: r.item_code,
            item_name: r.item_name,
            box_qty: r.box_qty,
            actual_stock: r.actual_stock,
            target_stock: r.target_stock,
          }))
        ),
      });

      // 3️⃣ EV Schedule
      const payload = scheduleRows.map(row => {
        const clean = {
          inv_no: row.inv_no,
          etd: row.etd,
          eta: row.eta,
          status: row.status,
          quantities: {},
        };

        inventoryRows.forEach(item => {
          clean.quantities[item.item_code] =
            row.quantities?.[item.item_code] || 0;
        });

        return clean;
      });

      await apiFetch(`${API_BASE}/api/ev-schedule/bulk`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      alert("저장 완료!");
      setEditMode(false);

    } catch (e) {
      console.error("EV 저장 실패:", e);
      alert("저장 중 오류 발생");
    }
  };



  const handleInvChange = async (tempId, value) => {
    const inv = value.trim();

    // INV 즉시 반영
    setScheduleRows(prev =>
      prev.map(row =>
        row.tempId === tempId ? { ...row, inv_no: inv } : row
      )
    );

    if (!inv) return;

    try {
      // =========================
      // 1) Invoice 정보 불러오기 (기존 로직 그대로 유지)
      // =========================
      const resInv = await apiFetch(`${API_BASE}/api/invoice/${inv}`);
      const invData = await resInv.json();

      if (invData.error) return;

      const etd = invData.etd || "";
      const eta = invData.eta || "";
      const status = getScheduleStatus(etd, eta);

      // =========================
      // 2) 새로운 통합 API 호출
      // =========================
      const resFull = await apiFetch(`${API_BASE}/api/ev/packing-full/${inv}`);
      const fullData = await resFull.json();

      if (fullData.error) return;

      // qty_map 사용 (딕셔너리)
      const qty_map = fullData.qty_map || {};

      // normalize
      const normalize = (v) =>
        (v || "").toString().trim().replace(/\s+/g, "").toUpperCase();

      // =========================
      // 3) qty 매핑 (운항중일 때만)
      // =========================
      const newRowData = {};

      const newQuantities = {};

      inventoryRows.forEach(item => {
        newQuantities[item.item_code] = qty_map[item.item_code] || 0;

      });


      // =========================
      // 4) 최종 업데이트 (기존 로직 그대로)
      // =========================
      setScheduleRows(prev =>
        prev.map(row =>
          row.tempId === tempId
            ? { ...row, etd, eta, status, quantities: newQuantities }
            : row
        )
      );

    } catch (err) {
      console.error("INV 자동로드 실패:", err);
    }
  };


  const deleteRow = () => {
    setScheduleRows(prev => prev.slice(0, -1));
  };



  const addRow = () => {
    const newQuantities = {};

    inventoryRows.forEach(item => {
      newQuantities[item.item_code] = 0;
    });

    const newRow = {
      tempId: uuidv4(),
      inv_no: "",
      etd: "",
      eta: "",
      status: "",
      quantities: newQuantities,
    };

    setScheduleRows(prev => [...prev, newRow]);
  };


  const companyGroups = React.useMemo(() => {
    const map = new Map();

    inventoryRows.forEach(r => {
      if (!r.company) return;
      if (!map.has(r.company)) {
        map.set(r.company, []);
      }
      map.get(r.company).push(r);
    });

    return Array.from(map.entries());
    // [ [companyName, rows[]], ... ]
  }, [inventoryRows]);





  /* ----------------------------------
        🔹 한국 / 미국 날짜 변환 함수
  ---------------------------------- */
  function parseKRDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, -9, 0, 0));  // 한국 00시 고정
  }


  function parseUSDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 6, 0, 0)); // 미국 00:00
  }


  /* ----------------------------------
        🔹 미국 Alabama 기준 "오늘 00:00"
  ---------------------------------- */
  function todayUS() {
    const nowUS = new Date().toLocaleString("en-US", {
      timeZone: "America/Chicago",
    });

    const d = new Date(nowUS);
    d.setHours(0, 0, 0, 0);
    return d;
  }




  const [scheduleRows, setScheduleRows] = useState([]);


  const API_BASE = import.meta.env.VITE_API_URL;
  useEffect(() => {
    loadEvData();
  }, []);
  useEffect(() => {
    if (scheduleRows.length > 0) {
      scheduleRows.forEach(row => {
        if (row.inv_no) {
          handleInvAutoLoad(row.tempId, row.inv_no);
        }
      });
    }
  }, [scheduleRows.length]);

  const loadEvData = async () => {
    try {
      // 1) EV Setting
      const resSetting = await apiFetch(`${API_BASE}/api/ev-setting`);
      const setting = await resSetting.json();
      setWriter(setting.writer || "");
      setUsDate(setting.us_date || "");

      // 2) EV Inventory (ev_inventory)
      const resInv = await apiFetch(`${API_BASE}/api/ev-inventory`);
      const inventory = await resInv.json();
      setInventoryRows(
        inventory.map((row, idx) => ({
          ...row,
          tempId: uuidv4(),
          seq: idx + 1,   // ⭐ 최초 로딩 시 순번
        }))
      );

      // 3) EV Schedule (ev_schedule)
      const resSchedule = await apiFetch(`${API_BASE}/api/ev-schedule`);
      const schedules = await resSchedule.json();

      setScheduleRows(
        schedules.map((r) => ({
          ...r,
          tempId: uuidv4(),   // ★ Axle와 동일하게 tempId 생성
        }))
      );

    } catch (err) {
      console.error("EV 데이터 불러오기 실패:", err);
    }
  };



  const [todayAlabama, setTodayAlabama] = useState(null);

  useEffect(() => {
    setTodayAlabama(getTodayInAlabama());
  }, []);

  const getTodayInAlabama = () => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(new Date());

    const y = parts.find(p => p.type === "year").value;
    const m = parts.find(p => p.type === "month").value;
    const d = parts.find(p => p.type === "day").value;

    // 미국 날짜의 "정확한 00:00:00" 고정
    return new Date(`${y}-${m}-${d}T00:00:00`);
  };


  // ★ 운송 상태 색상 스타일 (AxleSubPage 동일)
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

  // ★ 엑셀 수식 =IF(F6>=F4*1.13,"초과", ...)
  const getStatus = (actual, target) => {
    if (actual >= target * 1.13) return "초과";
    if (actual >= target && actual > target * 0.96) return "양호";
    if (actual <= target * 0.7) return "위험";
    return "적정재고미달";
  };

  // ★ 상태 색상 지정
  const statusColor = (status) => {
    switch (status) {
      case "초과": return "purple";
      case "양호": return "green";
      case "위험": return "red";
      case "적정재고미달": return "orange";
      default: return "black";
    }
  };

  const formatNumber = (num) =>
    typeof num === "number"
      ? num.toLocaleString()
      : num ? Number(num).toLocaleString() : "0";



  const navigate = useNavigate();

  // 수정모드 ON/OFF
  const [editMode, setEditMode] = useState(false);

  // 작성자 + 북미 날짜
  const [writer, setWriter] = useState("");
  const [usDate, setUsDate] = useState("");
  useEffect(() => {
    if (!usDate || inventoryRows.length === 0) return;

    (async () => {
      const hydrated = await applyEvAuditToRowsPure(inventoryRows);
      setInventoryRows(hydrated);
    })();
  }, [
    usDate,
    inventoryRows.map(r => r.item_code).join("|")  // ⭐⭐⭐ 핵심
  ]);



  // 과부족 패널 토글
  const [showStockPanel, setShowStockPanel] = useState(false);






  // ============================
  // 날짜 → (11월 초, 중순, 말)
  // ============================
  const getPeriod = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();

    if (day <= 10) return `${month}월 초`;
    if (day <= 20) return `${month}월 중순`;
    return `${month}월 말`;
  };

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

      {/* 수정모드 & 저장 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={handleToggleEditMode}
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
          color="primary"
          disabled={!editMode}
          onClick={saveSchedule}
        >
          저장
        </Button>
      </Box>

      {/* 작성자 + 북미 날짜 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}>
        <TextField
          label="작성자"
          size="small"
          value={writer}
          InputProps={{ readOnly: !editMode }}
          onChange={e => editMode && setWriter(e.target.value)}
          sx={{ width: 160 }}
        />

        <TextField
          label="북미 기준 날짜 (YYYY-MM-DD)"
          size="small"
          value={usDate}
          InputProps={{ readOnly: !editMode }}
          onChange={e => editMode && setUsDate(e.target.value)}
          sx={{ width: 200 }}
        />
      </Box>

      {/* 제목 + 토글 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3
        }}
      >
        <Typography variant="h5" sx={{ fontSize: 18, fontWeight: "bold" }}>
          EV 서브조립품 운송일정 관리
          {usDate ? ` (${getPeriod(usDate)})` : ""}
        </Typography>

        <Button
          size="small"
          variant="outlined"
          onClick={() => setShowStockPanel(!showStockPanel)}
          sx={{
            fontSize: 14, fontWeight: "bold", mt: 2,
            mb: -1,
          }}
        >
          {showStockPanel ? "− 접기" : "+ 과부족 상태표 보기"}
        </Button>
      </Box>

      {/* =====================================
          과부족 상태 패널
      ===================================== */}
      {showStockPanel && (
        <Paper sx={{ p: 2, mb: 4, border: "2px solid #777", }}>
          {/* 과부족 상태 제목 + 적정재고 입력 */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2
            }}
          >
            <Typography sx={{ fontWeight: "bold", fontSize: 18 }}>
              ※ 과부족 상태 ※
            </Typography>

            {/* 🔥 수정모드일 때만 버튼 표시 */}
            {editMode && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => {
                    const newItem = {
                      id: null,
                      tempId: uuidv4(),
                      seq: inventoryRows.length + 1, // 최초만 부여
                      company: "",
                      item_name: "",
                      item_code: "",
                      box_qty: 0,
                      actual_stock: 0,
                      target_stock: 0,
                    };

                    // 1️⃣ EV 재고에 추가
                    setInventoryRows(prev => {
                      const sameCompanyRows = prev.filter(r => r.company === newItem.company);
                      const otherRows = prev.filter(r => r.company !== newItem.company);

                      let insertIndex = prev.length;

                      if (sameCompanyRows.length > 0) {
                        const lastSame = sameCompanyRows[sameCompanyRows.length - 1];
                        insertIndex = prev.findIndex(r => r.tempId === lastSame.tempId) + 1;
                      }

                      const next = [...prev];
                      next.splice(insertIndex, 0, newItem);

                      // ⭐ 순번 재정렬
                      return next.map((r, idx) => ({
                        ...r,
                        seq: idx + 1
                      }));
                    });


                    // 2️⃣ 모든 운송 스케줄 row에 qty 슬롯 자동 추가
                    setScheduleRows(prev =>
                      prev.map(r => ({
                        ...r,
                        quantities: {
                          ...r.quantities,
                          [newItem.item_code]: 0,
                        },
                      }))
                    );
                  }}


                >
                  + 품목추가
                </Button>


                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => {
                    // 1️⃣ 삭제 모드 진입
                    if (!deleteMode) {
                      setDeleteMode(true);
                      setSelectedEvRowIds([]);
                      return;
                    }

                    // 2️⃣ 선택 안 했을 때
                    if (selectedEvRowIds.length === 0) {
                      alert("삭제할 행을 선택하세요.");
                      return;
                    }

                    // 3️⃣ 실제 삭제
                    setInventoryRows(prev =>
                      prev.filter(r => !selectedEvRowIds.includes(r.tempId))
                    );

                    // 4️⃣ 초기화
                    setSelectedEvRowIds([]);
                    setDeleteMode(false);
                  }}
                >
                  {deleteMode ? "선택 삭제" : "- 품목삭제"}
                </Button>


              </Box>
            )}
          </Box>



          <Table size="small" sx={{
            borderTop: "2px solid #000",   // ⭐ 헤더 위 굵은 선
          }}>
            <TableHead
              sx={{
                bgcolor: "#ffe599",          // 🔥 운송 스케줄과 동일한 헤더 배경색
                "& th": {
                  fontWeight: "bold",
                  fontSize: "15px",
                  textAlign: "center",

                }
              }}
            >
              <TableRow>
                <TableCell align="center">순번</TableCell>
                <TableCell>업체명</TableCell>
                <TableCell>품번</TableCell>
                <TableCell>품명</TableCell>
                <TableCell>박스 입수량</TableCell>
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
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                  {getKoreanMonthLabel(usDate)}
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
              {inventoryRows.map((row, idx) => {
                const proper = row.target_stock ?? 0;

                // 🔥 운항중 qty 자동 계산
                const transit = calcInTransitEV(row.item_code);

                // 🔥 운항중 + 실사자료
                const total = row.actual_stock + transit;

                const status = getStatus(row.actual_stock, proper);
                const bg = getCompanyColor(row.company);

                return (
                  <TableRow
                    key={row.tempId || idx}
                    onClick={() => {
                      if (!editMode || !deleteMode) return;

                      setSelectedEvRowIds(prev =>
                        prev.includes(row.tempId)
                          ? prev.filter(id => id !== row.tempId)
                          : [...prev, row.tempId]
                      );
                    }}

                    sx={{
                      cursor: editMode ? "pointer" : "default",

                      backgroundColor: selectedEvRowIds.includes(row.tempId)
                        ? "#cfe8ff"                         // ✅ 선택된 행 (Axle 느낌)
                        : status === "적정재고미달"
                          ? "#fdf1f3"
                          : "inherit",

                      "&:hover": editMode
                        ? { backgroundColor: "#e3f2fd" }
                        : {},
                    }}
                  >

                    {/* ✅ 순번 */}
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>
                      {row.seq}
                    </TableCell>

                    <TableCell
                      align="center"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!editMode) return;
                        setTargetEvRowId(row.tempId);
                        setItemDialogOpen(true);
                      }}
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


                            bgcolor: bg,
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
                        setTargetEvRowId(row.tempId);
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
                        e.stopPropagation();
                        if (!editMode) return;
                        setTargetEvRowId(row.tempId);
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





                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      {formatNumber(row.box_qty)}
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      {formatNumber(row.target_stock)}
                    </TableCell>
                    
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      {formatNumber(row.actual_stock)}
                    </TableCell>




                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      {formatNumber(transit)}
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      {formatNumber(total)}
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      <Box component="span" sx={getStockStatusStyle(status)}>
                        {status}
                      </Box>

                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>

          </Table>
        </Paper>
      )}



      {/* =====================================
          운송 스케줄 패널
      ===================================== */}
      <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
        <Typography sx={{ fontWeight: "bold", fontSize: 18 }}>
          ※ 운송 스케줄 현황 ※
        </Typography>


        {/* 🔥🔥 버튼을 제목 바로 아래, 우측 상단에 배치 */}
        {editMode && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: -3, mb: 1 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="contained" color="success" size="small" onClick={addRow}>
                + 행추가
              </Button>
              <Button variant="contained" color="error" size="small" onClick={deleteRow}>
                - 행삭제
              </Button>
            </Box>
          </Box>

        )}

        {/* 🔥🔥 이 부분 추가!! */}

        <Box sx={{ width: "100%" }}>
          {/* ← 여기에서 전체 테이블 가로 사이즈 확보 (28개 품목 때문에 길어짐) */}

          <Table
            size="small"
            sx={{
              mt: 2,
              position: "relative",  // ← 추가!!!
              borderCollapse: "collapse !important",
              borderSpacing: "0px !important",
              borderTop: "2px solid #000",
              "& td, & th": {
                borderCollapse: "separate !important",
                borderSpacing: "0 !important",
                margin: 0,

              }
            }}
          >

            {/* 🔥 업체명 위 선 제거용 오버레이 (AxleSub와 동일) */}
            <Box
              sx={{
                position: "absolute",
                top: "-2px",      // ⭐ 테이블 상단선 위치
                left: 0,
                width: "100%",
                height: "6px",    // ⭐ 선보다 충분히 크게
                bgcolor: "#ffffff",
                zIndex: 20,
                pointerEvents: "none",
              }}
            />



            <TableHead>

              {/* 🔥 업체 그룹 헤더 동적 생성 */}
              <TableRow sx={{ bgcolor: "#ffffff !important" }}>
                <TableCell colSpan={4} />

                {companyGroups.map(([company, rows]) => {
                  const bg = getCompanyColor(company);

                  return (
                    <TableCell
                      key={company}
                      align="center"
                      colSpan={rows.length}   // ⭐ 핵심
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


              {/* 🔥 품명 헤더 */}
              <TableRow sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000", }}>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>INV#</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>ETD</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>ETA</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>상태</TableCell>

                {companyGroups.flatMap(([_, rows]) =>
                  rows.map((item, idx) => (
                    <TableCell
                      key={item.item_code}
                      align="center"
                      sx={{

                        backgroundColor: "#ffe599",
                        padding: 0,
                        "&:hover": {
                          backgroundColor: "#ffe6eb",
                        },
                      }}
                    >
                      <Tooltip
                        title={
                          <Box sx={{ textAlign: "center", lineHeight: 1.4 }}>
                            <Typography
                              sx={{
                                fontSize: "16px",
                                fontWeight: "bold",
                              }}
                            >
                              {item.item_name || "미지정 품목"}
                            </Typography>

                            <Typography
                              sx={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                color: "inherit",   // ⭐ 품명과 동일 색상
                              }}
                            >
                              ({item.item_code || "품번 없음"})
                            </Typography>
                          </Box>
                        }
                        arrow
                        placement="top"
                      >

                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            padding: "10px 0",
                            cursor: "help",
                            fontWeight: "bold",
                            fontSize: "15px",
                          }}
                        >
                          {item.seq}


                        </div>
                      </Tooltip>
                    </TableCell>
                  ))
                )}



              </TableRow>

            </TableHead>



            <TableBody>
              {scheduleRows.map(row => (
                <TableRow
                  key={row.tempId}
                  sx={{
                    borderBottom: "1px solid #ddd",   // 🔥 얇은 회색 라인
                    "& td": {
                      borderBottom: "1px solid #ddd"  // 각 셀마다 동일 적용
                    }
                  }}
                >


                  {/* INV# (수정가능) */}
                  <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
                    {editMode ? (
                      <TextField
                        size="small"
                        value={row.inv_no || ""}
                        onChange={e => handleInvChange(row.tempId, e.target.value)}
                        sx={{ width: 120 }}
                      />
                    ) : (
                      <span>{row.inv_no || ""}</span>
                    )}
                  </TableCell>


                  {/* ETD (수정 불가, 표시만) */}
                  <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
                    {row.etd}
                  </TableCell>

                  {/* ETA — 기존 색깔 박스 유지 */}
                  <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
                    {getScheduleStatus(row.etd, row.eta) === "운항중" ? (
                      <Box sx={getForgingStatusStyle("운항중")}>
                        {row.eta}
                      </Box>
                    ) : (
                      row.eta
                    )}
                  </TableCell>

                  {/* 상태 — 기존 스타일 박스 유지 */}
                  <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
                    <Box sx={getForgingStatusStyle(getScheduleStatus(row.etd, row.eta))}>
                      {getScheduleStatus(row.etd, row.eta)}
                    </Box>
                  </TableCell>

                  {/* 28개 품목 qty → 수정칸 없음 (숫자만 출력) */}
                  {companyGroups.flatMap(([_, rows]) =>
                    rows.map(item => (
                      <TableCell
                        key={`${item.item_code}-${item.seq}`}

                        align="center"
                        sx={{ fontWeight: "bold" }}
                      >
                        {formatNumber(row.quantities?.[item.item_code] || 0)}
                      </TableCell>
                    ))
                  )}



                </TableRow>
              ))}
            </TableBody>



          </Table>
        </Box>

        <UnitSearchDialog
          open={itemDialogOpen}
          onClose={() => {
            setItemDialogOpen(false);
            setTargetEvRowId(null);
          }}
          onSelect={handleSelectEvItem}
        />


      </Paper>

    </Box>
  );
}
