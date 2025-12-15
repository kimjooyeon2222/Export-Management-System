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



export default function AxleSubPage() {

  const getAxleJudgeStyle = (status) => {
  switch (status) {
    case "초과":
      return {
        bgcolor: "#ead1dc",
        color: "#99004d",
        fontWeight: "bold",
        borderRadius: "6px",
        px: 1.2,
        display: "inline-block",
      };
    case "양호":
      return {
        bgcolor: "#d9ead3",
        color: "#274e13",
        fontWeight: "bold",
        borderRadius: "6px",
        px: 1.2,
        display: "inline-block",
      };
    case "위험":
      return {
        bgcolor: "#f4cccc",
        color: "#990000",
        fontWeight: "bold",
        borderRadius: "6px",
        px: 1.2,
        display: "inline-block",
      };
    case "적정재고미달":
      return {
        bgcolor: "#fff2cc",
        color: "#7f6000",
        fontWeight: "bold",
        borderRadius: "6px",
        px: 1.2,
        display: "inline-block",
      };
    default:
      return {};
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

const axleCompanyColors = {
  "윤영테크": "#FFD966",
  "대영이엔피": "#A9D18E",
  "신우신": "#9BC2E6"
};

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
    const keyMap = {
  "PLUG": "plug",
  "GASKET": "gasket",
  "PLATE": "plate",
  "PIN-DOWEL": "dowel_pin"   // ← 이게 핵심
};
const keyMapForAxle = {
  "PLUG": "plug",
  "GASKET": "gasket",
  "DOWEL PIN": "dowel_pin",
  "PLATE": "plate"
};

const fetchPackingQty = async (inv_no) => {
  if (!inv_no) return { plug: 0, gasket: 0, dowel_pin: 0, plate: 0 };

  try {
    const res = await apiFetch(`${API_BASE}/api/packing-list/by-inv/${inv_no}`);
    const data = await res.json();

    const getQty = (name) => {
      const row = data.find(x => x.part_name?.toUpperCase() === name);
      return row ? Number(row.qty) : 0;
    };

    return {
      plug: getQty("PLUG"),
      gasket: getQty("GASKET"),
      dowel_pin: getQty("PIN-DOWEL"),
      plate: getQty("PLATE"),
    };

  } catch (err) {
    console.error("packing_list 로딩 오류:", err);
    return { plug: 0, gasket: 0, dowel_pin: 0, plate: 0 };
  }
};


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
const calcInTransit = (itemName) => {
  if (!Array.isArray(scheduleRows)) return 0;

  const key = keyMapForAxle[itemName?.toUpperCase()];
  if (!key) return 0;

  return scheduleRows
    .filter(row => getScheduleStatus(row.etd, row.eta) === "운항중")
    .reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
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



    const saveSetting = async () => {
  await apiFetch(`${API_BASE}/api/axle-setting`, {
    method: "PUT",
    body: JSON.stringify({
      target_stock: targetStockSetting,
      writer,
      us_date: usDate
    })
  });
};

    const fetchSetting = async () => {
  const res = await apiFetch(`${API_BASE}/api/axle-setting`);
  const data = await res.json();

  setTargetStockSetting(data.target_stock);
  setWriter(data.writer);
  setUsDate(data.us_date);
};

const [targetStockSetting, setTargetStockSetting] = useState(0);
    // 🔥 targetStockSetting 변경 시 모든 행의 target_stock를 자동 갱신
useEffect(() => {
  setAxleRows(prev =>
    Array.isArray(prev)
      ? prev.map(row => ({
          ...row,
          target_stock: targetStockSetting
        }))
      : []
  );
}, [targetStockSetting]);


    // ★ 엑셀 수식 =IF(F6>=F4*1.13,"초과", ...)
const getStatus = (actual, target) => {
  if (actual >= target * 1.13) return "초과";
  if (actual >= target && actual > target * 0.96) return "양호";
  if (actual <= target * 0.7) return "위험";
  return "적정재고미달";
};

const statusColor = (status) => {
  switch (status) {
    case "초과": return "purple";
    case "양호": return "green";
    case "위험": return "red";
    case "적정재고미달": return "orange";
    default: return "black";
  }
};


    const [scheduleRows, setScheduleRows] = useState([]);

useEffect(() => {
    // DB에서 scheduleRows 로드가 끝난 이후 실행
    if (scheduleRows.length > 0) {
        scheduleRows.forEach(async row => {
            if (row.inv_no) {
                const qty = await fetchPackingQty(row.inv_no);
                updateScheduleCell(row.tempId, "plug", qty.plug);
updateScheduleCell(row.tempId, "gasket", qty.gasket);
updateScheduleCell(row.tempId, "dowel_pin", qty.dowel_pin);
updateScheduleCell(row.tempId, "plate", qty.plate);


                const ship = await apiFetch(`${API_BASE}/api/invoice/${row.inv_no}`).then(r => r.json());
                if (!ship.error) {
                   updateScheduleCell(row.tempId, "etd", ship.etd);
updateScheduleCell(row.tempId, "eta", ship.eta);

                }
            }
        });
    }
}, [scheduleRows.length]);
const refreshScheduleValues = async (rows) => {
  for (const row of rows) {
    if (!row.inv_no) continue;

    const qty = await fetchPackingQty(row.inv_no);
    updateScheduleCell(row.tempId, "plug", qty.plug);
    updateScheduleCell(row.tempId, "gasket", qty.gasket);
    updateScheduleCell(row.tempId, "dowel_pin", qty.dowel_pin);
    updateScheduleCell(row.tempId, "plate", qty.plate);

    const ship = await apiFetch(`${API_BASE}/api/invoice/${row.inv_no}`).then(r => r.json());
    if (!ship.error) {
      updateScheduleCell(row.tempId, "etd", ship.etd || "");
      updateScheduleCell(row.tempId, "eta", ship.eta || "");
    }
  }
};

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




   



  const navigate = useNavigate();

  // 수정모드 ON/OFF
  const [editMode, setEditMode] = useState(false);

  // 작성자/날짜
  const [writer, setWriter] = useState("");
  const [usDate, setUsDate] = useState("");

  // AXLE 재고 목록
  const [axleRows, setAxleRows] = useState([]);

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

    setAxleRows(data);
  } catch (err) {
    console.error("AXLE 데이터 로드 오류:", err);
    setAxleRows([]);
  }
};



  useEffect(() => {
    fetchAxleData();
      fetchScheduleData(); // 추가!
      fetchSetting(); // ← 추가

  }, []);

  // ===============================
  // 🔥  AXLE 항목 저장
  // ===============================
  // ⭐ 저장 함수
const saveAxleData = async () => {
  try {
    // 1) AXLE 저장
    for (let row of axleRows) {
      const cleanRow = { ...row };
      delete cleanRow.updated_at;

      await apiFetch(`${API_BASE}/api/axle/${row.id}`, {
        method: "PUT",
        body: JSON.stringify(cleanRow)
      });
    }

    // 2) 설정 저장
    await saveSetting();

    // 3) 스케줄 Bulk 저장
    await apiFetch(`${API_BASE}/api/axle-schedule/bulk`, {
      method: "POST",
      body: JSON.stringify(scheduleRows)
    });

    alert("저장 완료!");
    setEditMode(false);

    // 4) 한 번만 최신 로드 + 최신 값으로 연동
    const newSchedule = await fetchScheduleData();
    await refreshScheduleValues(newSchedule);

  } catch (err) {
    console.error("저장 오류:", err);
    alert("저장 실패!");
  }
};





  // ===============================
  // 🔥  테이블 값 변경 핸들러
  // ===============================
  const updateCell = (id, field, value) => {
    setAxleRows(prev =>
      prev.map(row =>
        row.tempId === id ? { ...row, [field]: value } : row
      )
    );
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
          sx={{ fontSize: 14, fontWeight: "bold" }}
        >
          {showStockPanel ? "− 접기" : "+ 과부족 상태표 보기"}
        </Button>
      </Box>

      {/* ===============================
          과부족 상태표
      =============================== */}
      {showStockPanel && (
  <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
      <Box sx={{ display: "flex",  mb: 2, gap:3}}>
    <Typography sx={{ fontWeight: "bold", fontSize: 18, mb: 1 }}>
      ※ 과부족 상태 ※
    </Typography>
 
  {editMode ? (
  <TextField
    label="적정재고 기준"
    size="small"
    type="number"
    value={targetStockSetting}
    onChange={(e) => setTargetStockSetting(Number(e.target.value))}
    InputLabelProps={{
      sx: { fontSize: "16px", fontWeight: "bold" }
    }}
    sx={{ width: 160 }}
  />
) : (
  <Typography sx={{ fontSize: 16, fontWeight: "bold", ml: 1, color:"#777" }}>
    적정재고 기준: {formatNumber(targetStockSetting)}
  </Typography>
)}

  
</Box>



    <Table size="small" sx={{ "& *": { fontWeight: "bold" } }}>

      <TableHead sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000" }}>
        <TableRow>
          <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>업체명</TableCell>
          <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>품명</TableCell>
          <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>품번</TableCell>
          <TableCell align="center" sx={{ fontSize: "15px" , fontWeight: "bold" }}>박스 입수량</TableCell>
          <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>실사자료</TableCell>
          <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>적정재고</TableCell>
          <TableCell align="center" sx={{ fontSize: "15px" , fontWeight: "bold" }}>운항중</TableCell>

          <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>운항중 + 실사자료</TableCell>
          <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>판단결과</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {axleRows.map((row) => {
  const inTransit = calcInTransit(row.item_name);   // 운항중
  const existing = row.actual_stock;                // 기존재고
  const total = inTransit + existing;               // 총합
  const target =
    row.item_name?.toUpperCase() === "DOWEL PIN"
      ? targetStockSetting * 2
      : targetStockSetting;

       const judge = getStatus(existing, target); 
  return (

<TableRow
  key={row.id}
  sx={{
    backgroundColor: judge === "초과" ? "#faeeee" : "inherit" 
  }}
>

      <TableCell align="center">
  <Box
    sx={{
      display: "inline-block",
      px: 1.5,
      py: 0.4,
      borderRadius: "6px",
      fontWeight: "bold",
      fontSize: "15px",
      bgcolor: axleCompanyColors[row.company] || "#ddd",
      color: getContrastTextColor(axleCompanyColors[row.company]),
      minWidth: "90px",
      textAlign: "center"
    }}
  >
    {row.company}
  </Box>
</TableCell>

      <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>{row.item_name}</TableCell>
      <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>{row.item_code}</TableCell>
      <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>{formatNumber(row.box_qty)}</TableCell>

      {/* 실사자료 */}
      <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" 
       }}>
        {editMode ? (
          <TextField
            size="small"
            type="number"
            value={row.actual_stock}
            onChange={(e) =>
              updateCell(row.id, "actual_stock", Number(e.target.value))
            }
            sx={{ width: 90 }}
          />
        ) : (
          <span>{formatNumber(row.actual_stock)}</span>
        )}
      </TableCell>

      {/* 적정재고 */}
      <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>{formatNumber(target)}</TableCell>

      {/* 🔥 운항중 → 여기 수정됨 */}
      <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>{formatNumber(inTransit)}</TableCell>



      {/* 🔥 운항중 + 기존재고 */}
      <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>{formatNumber(total)}</TableCell>

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
<Box sx={{  display: "flex", justifyContent: "flex-end", mb: 1, gap: 1  }}>
      <Button
        variant="contained"
        color="success"
        size="small"
        disabled={!editMode}
        onClick={() =>
  setScheduleRows(prev => [
    ...prev,
    {
      tempId: uuidv4(),  // ⭐ 화면용
      id: null,          // ⭐ DB id (저장 전까지 null)
  inv_no: "",
  etd: "",
  eta: "",
  plug: 0,
  gasket: 0,
  dowel_pin: 0,
  plate: 0
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

    /* 기본 border 제거는 border-top만 없애야 함 */
    "& th, & td": {
      borderTop: "0 !important",
      padding: "6px 8px !important",
    },

    /* 행×행 경계선은 여기서 추가 */
    "& td": {
      borderBottom: "1px solid #e0e0e0 !important",
    },

    "& th": {
      borderBottom: "1px solid #e0e0e0 !important",
      fontWeight: "bold !important",
    },

    /* 업체 헤더라면(첫 thead 줄) 위쪽 선 아예 제거 */
    "& thead tr:first-of-type th": {
      borderTop: "0 !important",
      borderBottom: "1px solid #b7b7b7 !important",
    }
  }}
>


  {/* 상단 흰색 오버레이 — 빈칸 만드는 원인이었음 → 유지하되 충돌 수정 */}
  <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "3px",
      bgcolor: "#ffffff",
      zIndex: 20,
      pointerEvents: "none",
    }}
  />


  <TableHead>

  {/* 🔥 업체별 대형 헤더 */}
  <TableRow sx={{ bgcolor: "#ffffff !important" }}>
    <TableCell colSpan={4} />

    {/* PLUG + GASKET → 윤영테크 */}
    <TableCell
      colSpan={2}
      align="center"
      sx={{
        fontWeight: "bold",
        fontSize: "16px",
        bgcolor: "#FFD966",
        color: "#000",
        borderBottom: "2px solid #b7b7b7"
      }}
    >
      윤영테크
    </TableCell>

    {/* DOWEL PIN → 대영이엔피 */}
    <TableCell
      colSpan={1}
      align="center"
      sx={{
        fontWeight: "bold",
        fontSize: "16px",
        bgcolor: "#A9D18E",
        color: "#000",
        borderBottom: "2px solid #b7b7b7"
      }}
    >
      대영이엔피
    </TableCell>

    {/* PLATE → 신우신 */}
    <TableCell
      colSpan={1}
      align="center"
      sx={{
        fontWeight: "bold",
        fontSize: "16px",
        bgcolor: "#9BC2E6",
        color: "#000",
        borderBottom: "2px solid #b7b7b7"
      }}
    >
      신우신
    </TableCell>
  </TableRow>

  {/* 🔥 기존 품명 헤더 — 네가 준 코드 그대로 유지 */}
  <TableRow sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000" }}>
    <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>INV#</TableCell>
    <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>ETD</TableCell>
    <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>ETA</TableCell>
    <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>상태</TableCell>
    <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>PLUG</TableCell>
    <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>GASKET</TableCell>
    <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>DOWEL PIN</TableCell>
    <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>PLATE</TableCell>
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
  const qty = await fetchPackingQty(inv);


updateScheduleCell(row.tempId, "plug", qty.plug);
updateScheduleCell(row.tempId, "gasket", qty.gasket);
updateScheduleCell(row.tempId, "dowel_pin", qty.dowel_pin);
updateScheduleCell(row.tempId, "plate", qty.plate);



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
      <TableCell  align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
     
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
<TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>
  <Box sx={getForgingStatusStyle(getScheduleStatus(row.etd, row.eta))}>
    {getScheduleStatus(row.etd, row.eta)}
  </Box>
</TableCell>



      {/* 수량들 */}
      <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>{formatNumber(row.plug)}</TableCell>
      <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>{formatNumber(row.gasket)}</TableCell>
      <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold"  }}>{formatNumber(row.dowel_pin)}</TableCell>
      <TableCell align="center" sx={{ fontSize: "15px" , fontWeight: "bold"}}>{formatNumber(row.plate)}</TableCell>

    </TableRow>
  ))}
</TableBody>

  </Table>
</Paper>

    </Box>
  );
}
