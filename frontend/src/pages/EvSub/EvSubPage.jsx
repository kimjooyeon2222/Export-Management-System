import React, { useState, useEffect } from "react";
import { EV_PART_MAP } from "./EVPartMap";

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


export default function EvSubPage() {
  const handleSelectEvItem = (item) => {
    if (!targetEvRowId) return;

    setInventoryRows(prev =>
      prev.map(r =>
        r.tempId === targetEvRowId
          ? {
            ...r,
            company: item.company_name || "",
            item_code: item.item_no,
            item_name: item.item_name,
          }
          : r
      )
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
  // 🔥 품번 → 스케줄 표 컬럼(PART_NAMES 이름) 찾기
  // ==========================================
  const findPartNameByPartNo = (part_no) => {
    for (const label of PART_NAMES) {
      if (EV_PART_MAP[label]?.part_no === part_no) {
        return label;
      }
    }
    return null;
  };

  // ==========================================
  // 🔥 EV 운항중 qty 합계 계산
  // ==========================================
  const calcInTransitEV = (part_no) => {
    if (!Array.isArray(scheduleRows)) return 0;

    const partName = findPartNameByPartNo(part_no);
    if (!partName) return 0;

    return scheduleRows
      .filter(r => getScheduleStatus(r.etd, r.eta) === "운항중") // 운항중 조건
      .reduce((sum, r) => sum + (Number(r[partName]) || 0), 0);
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
      const newRowData = {};
      PART_NAMES.forEach(label => {
        const partNo = EV_PART_MAP[label]?.part_no;
        if (!partNo) {
          newRowData[label] = 0;
          return;
        }

        const key = normalize(partNo);
        newRowData[label] = status === "운항중" ? (qty_map[key] || 0) : 0;
      });

      // 4) 스케줄 업데이트
      setScheduleRows(prev =>
        prev.map(r =>
          r.tempId === tempId
            ? { ...r, etd, eta, status, ...newRowData }
            : r
        )
      );

    } catch (err) {
      console.error("INV 자동로드 실패:", err);
    }
  };


  const saveSchedule = async () => {
    try {
      // =========================
      // 1️⃣ EV 설정 저장 (작성자 / 날짜)
      // =========================
      await apiFetch(`${API_BASE}/api/ev-setting`, {
        method: "PUT",
        body: JSON.stringify({
          writer: writer,     // state
          us_date: usDate,    // YYYY-MM-DD
        }),
      });

      const payload = scheduleRows.map(row => {
        const cleanRow = {
          inv_no: row.inv_no,
          etd: row.etd,
          eta: row.eta,
          status: row.status,
        };

        PART_NAMES.forEach(name => {
          cleanRow[name] = row[name] || 0;
        });

        return cleanRow;
      });

      const res = await apiFetch(`${API_BASE}/api/ev-schedule/bulk`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      alert("저장 완료!");

    } catch (err) {
      console.error("저장 실패:", err);
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

      PART_NAMES.forEach(label => {
        const partNo = EV_PART_MAP[label]?.part_no;

        if (!partNo) {
          newRowData[label] = 0;
          return;
        }

        const key = normalize(partNo);
        const qty = qty_map[key] || 0;

        // 운항중일 때만 qty 표시
        newRowData[label] = status === "운항중" ? qty : 0;
      });

      // =========================
      // 4) 최종 업데이트 (기존 로직 그대로)
      // =========================
      setScheduleRows(prev =>
        prev.map(row =>
          row.tempId === tempId
            ? { ...row, etd, eta, status, ...newRowData }
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
    const newRow = {
      tempId: uuidv4(),
      inv_no: "",
      etd: "",
      eta: "",
      status: "",
    };

    PART_NAMES.forEach(name => newRow[name] = 0);

    setScheduleRows(prev => [...prev, newRow]);
  };





  // 🔥 회사별 컬럼 구간 매핑
  const companyGroups = [
    { name: "금강기업", range: [0, 5] },
    { name: "동일인더스트리", range: [6, 13] },
    { name: "삼성금속", range: [14, 14] },
    { name: "와이엠", range: [15, 15] },
    { name: "유신정밀공업", range: [16, 16] },
    { name: "화승알엔에이", range: [17, 19] },
    { name: "평화산업", range: [20, 21] },
    { name: "풍성아이엔디", range: [22, 25] },
    { name: "대일 CST", range: [26, 27] }
  ];
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

  const [inventoryRows, setInventoryRows] = useState([]);

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
      setInventoryRows(inventory);

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

  // 운송 스케줄용 품명 28개
  const PART_NAMES = [
    "PIN DOWEL (10140)",
    "PLUG TAPER",
    "STUD",
    "BOLT HEXAGON SOCKET HEAD (06121)",
    "BOLT HEXAGON SOCKET HEAD (06141)",
    "PIN DOWEL (04100)",
    "DOWEL PIN 1",
    "DOWEL PIN 2",
    "OIL NIPPLE",
    "RESOLVER PIN DOWEL",
    "NIPPLE_NO.1 (DO364)",
    "NIPPLE_NO.2 (DO364)",
    "NIPPLE_NO.1 (NI364)",
    "NIPPLE_NO.2 (NI364)",
    "PIN DOWEL (10200)",
    "M5 X 14 BOLT ASSY",
    "WASHER WAVE",
    "PIPE COOLING -D",
    "PIPE COOLINGD (1XAB0)",
    "PIPE COOLINGD (1XCA0)",
    "BRK'T ASS'Y MOTOR MTG,LH",
    "BRK'T ASS'Y MOTOR MTG,RH",
    "KNOCK BUSH (10090)",
    "KNOCK BUSH (08130)",
    "STUD (08256K)",
    "STUD (08206K)",
    "보호용 캡 (GNT-1)",
    "보호용 캡 (MRCAP)"
  ];

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

      {/* 수정모드 & 저장 */}
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
          sx={{ fontSize: 14, fontWeight: "bold" }}
        >
          {showStockPanel ? "− 접기" : "+ 과부족 상태표 보기"}
        </Button>
      </Box>

      {/* =====================================
          과부족 상태 패널
      ===================================== */}
      {showStockPanel && (
        <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
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
                    setInventoryRows(prev => [
                      ...prev,
                      {
                        id: null,
                        tempId: uuidv4(),
                        company: "",
                        item_name: "",
                        item_code: "",
                        box_qty: 0,
                        actual_stock: 0,
                        target_stock: 0,
                      }
                    ]);
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



          <Table size="small">
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
                <TableCell>실사자료</TableCell>
                <TableCell>적정재고</TableCell>
                <TableCell>운항중</TableCell>
                <TableCell>운항중 + 실사자료</TableCell>
                <TableCell>판단결과</TableCell>
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
                      {idx + 1}
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
                            bgcolor: companyColors[row.company] || "#ddd",
                            color: getContrastTextColor(companyColors[row.company]),
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
                      {formatNumber(row.actual_stock)}
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      {formatNumber(row.target_stock)}
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

              "& td, & th": {
                borderCollapse: "separate !important",
                borderSpacing: "0 !important",
                margin: 0,
              }
            }}
          >

            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "3px",
                bgcolor: "#ffffff",
                zIndex: 10
              }}
            />



            <TableHead>

              {/* 🔥 업체 그룹 헤더 동적 생성 */}
              <TableRow sx={{ bgcolor: "#ffffff !important" }}>
                <TableCell colSpan={4} /> {/* INV / ETD / ETA / 상태 */}

                {companyGroups.map((g, idx) => {
                  const [start, end] = g.range;
                  const span = end - start + 1;

                  return (
                    <TableCell
                      key={idx}
                      colSpan={span}
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        fontSize: "16px",
                        bgcolor: companyColors[g.name],  // ← 업체별 색상 적용!
                        color: "#000",

                        borderBottom: "2px solid #b7b7b7",

                      }}
                    >
                      {g.name}
                    </TableCell>

                  );
                })}
              </TableRow>

              {/* 🔥 품명 헤더 */}
              <TableRow sx={{ bgcolor: "#ffe599" }}>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>INV#</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>ETD</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>ETA</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>상태</TableCell>

                {PART_NAMES.map((name, idx) => (
                  <TableCell
                    key={idx}
                    align="center"
                    sx={{
                      backgroundColor: "#ffe599",
                      padding: 0,
                      "&:hover": {
                        backgroundColor: "#ffe6eb", // 🔥 Oil과 동일한 hover 색
                      },
                    }}
                  >
                    <Tooltip
                      title={
                        <span
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            lineHeight: 1.4,
                          }}
                        >
                          {name}
                        </span>
                      }
                      arrow
                      placement="top"
                    >
                      {/* 🔥 셀 전체를 덮는 hover 영역 */}
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
                        {idx + 1}
                      </div>
                    </Tooltip>
                  </TableCell>
                ))}


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
                  {PART_NAMES.map((pname, idx) => (
                    <TableCell key={idx} align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
                      {formatNumber(row[pname] || 0)}
                    </TableCell>
                  ))}

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
