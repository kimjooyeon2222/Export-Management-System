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
import HorizontalScroll from "./HorizontalScroll";

export default function EvSubPage() {
    


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

  function getChicagoOffset(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    timeZoneName: "short",
  }).formatToParts(date);

  const name = parts.find(p => p.type === "timeZoneName").value;
  return name === "CDT" ? -5 : -6;
}

const toAlabamaMidnight = (dateStr) => {
  if (!dateStr) return null;

  const [year, month, day] = dateStr.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day, 0, 0, 0);

  const offsetHours = getChicagoOffset(new Date(utc));
  const chicagoTimestamp = utc - offsetHours * 3600 * 1000;

  return new Date(chicagoTimestamp);
};
    const [scheduleRows, setScheduleRows] = useState([]);

    const [inventoryRows, setInventoryRows] = useState([]);

    const API_BASE = import.meta.env.VITE_API_URL;
    useEffect(() => {
  loadEvData();
}, []);

const loadEvData = async () => {
  try {
    // 1) EV Setting
    const resSetting = await fetch(`${API_BASE}/api/ev-setting`);
    const setting = await resSetting.json();
    setWriter(setting.writer || "");
    setUsDate(setting.us_date || "");

    // 2) EV Inventory (ev_inventory)
    const resInv = await fetch(`${API_BASE}/api/ev-inventory`);
    const inventory = await resInv.json();
    setInventoryRows(inventory);

    // 3) EV Schedule (ev_schedule)
    const resSchedule = await fetch(`${API_BASE}/api/ev-schedule`);
    const schedules = await resSchedule.json();

    setScheduleRows(
      schedules.map((r) => ({
        ...r,
        tempId: crypto.randomUUID(),   // ★ Axle와 동일하게 tempId 생성
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
  "PIN DOWEL(10140)",
  "PLUG TAPER",
  "STUD",
  "BOLT HEXAGON SOCKET HEAD",
  "BOLT HEXAGON SOCKET HEAD",
  "PIN DOWEL(04100)",
  "DOWEL PIN 1",
  "DOWEL PIN 2",
  "OIL NIPPLE",
  "RESOLVER PIN DOWEL",
  "NIPPLE_NO.1",
  "NIPPLE_NO.2",
  "NIPPLE_NO.1",
  "NIPPLE_NO.2",
  "PIN DOWEL",
  "M5 X 14 BOLT ASSY",
  "WASHER WAVE",
  "PIPE COOLING -D",
  "PIPE COOLINGD",
  "PIPE COOLINGD",
  "BRK'T ASS'Y MOTOR MTG,LH",
  "BRK'T ASS'Y MOTOR MTG,LH",
  "KNOCK BUSH",
  "KNOCK BUSH",
  "STUD",
  "STUD",
  "보호용 캡1",
  "보호용 캡2"
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
const [targetStockSetting, setTargetStockSetting] = useState(0);

  // 과부족 패널 토글
  const [showStockPanel, setShowStockPanel] = useState(false);

 
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
          onClick={() => alert("🛠 추후 DB 연동 예정")}
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
<Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
  <Typography sx={{ fontWeight: "bold", fontSize: 18 }}>
    ※ 과부족 상태 ※
  </Typography>

  {editMode ? (
    <TextField
      label="적정재고 기준"
      size="small"
      type="number"
      value={targetStockSetting}
      onChange={(e) => setTargetStockSetting(Number(e.target.value))}
      sx={{ width: 150 }}
    />
  ) : (
    <Typography sx={{ fontSize: 16, fontWeight: "bold", color: "#555" }}>
      적정재고 기준: {formatNumber(targetStockSetting)}
    </Typography>
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
          <TableCell>업체명</TableCell>
          <TableCell>품명</TableCell>
          <TableCell>품번</TableCell>
          <TableCell>박스 입수량</TableCell>
          <TableCell>실사자료</TableCell>
          <TableCell>적정재고</TableCell>
          <TableCell>운항중</TableCell>
          <TableCell>운항중 + 실사자료</TableCell>
          <TableCell>판단결과</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {[
          {
            company: "ABC",
            name: "PLUG",
            code: "111-222",
            box: 100,
            current: 1200,
            proper: 1000,
            transit: 300
          },
          {
            company: "XYZ",
            name: "GASKET",
            code: "333-444",
            box: 200,
            current: 600,
            proper: 900,
            transit: 50
          }
        ].map((row, idx) => {
          const total = row.transit + row.current;
          const status = getStatus(row.current, row.proper);

          return (
            <TableRow key={idx}>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>{row.company}</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>{row.name}</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>{row.code}</TableCell>
              <TableCell align="center">{row.box.toLocaleString()}</TableCell>
              <TableCell align="center">{row.current.toLocaleString()}</TableCell>
              <TableCell align="center">{row.proper.toLocaleString()}</TableCell>
              <TableCell align="center">{row.transit.toLocaleString()}</TableCell>
              <TableCell align="center">{total.toLocaleString()}</TableCell>

              <TableCell align="center">
                <Box
                  component="span"
                  sx={{
                    px: 1.2,
                    borderRadius: 1,
                    fontWeight: "bold",
                    color: statusColor(status)
                  }}
                >
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
        <Button variant="contained" color="success" size="small">
          + 행추가
        </Button>
        <Button variant="contained" color="error" size="small">
          - 행삭제
        </Button>
      </Box>
    </Box>

  )}
  
  {/* 🔥🔥 이 부분 추가!! */}
  <HorizontalScroll>
    <Box sx={{ minWidth: 4000 }}> 
      {/* ← 여기에서 전체 테이블 가로 사이즈 확보 (28개 품목 때문에 길어짐) */}

      <Table
  size="small"
  sx={{
    mt: 2,
    position: "relative",  // ← 추가!!!
    borderCollapse: "collapse !important",
    borderSpacing: "0px !important",

    "& td, & th": {
      border: "0px solid transparent !important",
      padding: "0 !important",
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
  <TableRow sx={{ bgcolor: "#ffffff !important"}}>
    <TableCell colSpan={4} /> {/* INV / ETD / ETA / 상태 */ }

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
    <TableCell align="center">INV#</TableCell>
    <TableCell align="center">ETD</TableCell>
    <TableCell align="center">ETA</TableCell>
    <TableCell align="center">상태</TableCell>

    {PART_NAMES.map((name, idx) => (
      <TableCell key={idx} align="center" sx={{ fontWeight: "bold" }}>
        {name}
      </TableCell>
    ))}
  </TableRow>

</TableHead>



        <TableBody>
          {scheduleRows.map(row => (
            <TableRow key={row.tempId}>
              <TableCell align="center">{row.inv_no}</TableCell>
              <TableCell align="center">{row.etd}</TableCell>
              <TableCell align="center">
  {getScheduleStatus(row.etd, row.eta) === "운항중" ? (
    <Box sx={getForgingStatusStyle("운항중")}>
      {row.eta}
    </Box>
  ) : (
    row.eta
  )}
</TableCell>


              <TableCell align="center">
  <Box sx={getForgingStatusStyle(getScheduleStatus(row.etd, row.eta))}>
    {getScheduleStatus(row.etd, row.eta)}
  </Box>
</TableCell>


              {PART_NAMES.map((pname, idx) => (
                <TableCell key={idx} align="center">
                  {formatNumber(row[pname] || 0)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>

      </Table>
    </Box>
  </HorizontalScroll>
  
</Paper>

    </Box>
  );
}
