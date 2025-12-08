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
    const [todayAlabama, setTodayAlabama] = useState(null);

useEffect(() => {
  setTodayAlabama(new Date(getTodayInAlabama()));
}, []);

const getTodayInAlabama = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const str = formatter.format(new Date());
  return new Date(str);
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
  "PIN DOWEL",
  "PLUG TAPER",
  "STUD",
  "BOLT HEXAGON SOCKET HEAD",
  "BOLT HEXAGON SOCKET HEAD",
  "PIN DOWEL",
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

    // 🚚 운송 스케줄 더미 데이터 (DB 연동 전 테스트용)
const [scheduleRows, setScheduleRows] = useState([
  {
    tempId: 1,
    inv_no: "INV001",
    etd: "2025-12-01",
    eta: "2025-12-28",
    // 28개 품명 수량 자동 샘플 생성
    ...Object.fromEntries(PART_NAMES.map((n) => [n, Math.floor(Math.random() * 200)]))
  },
  {
    tempId: 2,
    inv_no: "INV002",
    etd: "2025-12-05",
    eta: "2026-01-10",
    ...Object.fromEntries(PART_NAMES.map((n) => [n, Math.floor(Math.random() * 200)]))
  }
]);


  const navigate = useNavigate();

  // 수정모드 ON/OFF
  const [editMode, setEditMode] = useState(false);

  // 작성자 + 북미 날짜
  const [writer, setWriter] = useState("");
  const [usDate, setUsDate] = useState("");

  // 과부족 패널 토글
  const [showStockPanel, setShowStockPanel] = useState(false);

 
  // ============================
  // 운송 스케줄 계산
  // ============================
  const getScheduleStatus = (etd, eta) => {
  if (!todayAlabama) return "";

  const today = todayAlabama;

  // ETA < TODAY → 입고완료
  if (eta && new Date(eta) < today) {
    return "입고완료";
  }

  // ETA 없음 → 부산항 미입고
  if (!eta || eta === "일정 없음") {
    return "부산항 미입고";
  }

  // ETD > TODAY → 선적대기중
  if (etd && new Date(etd) > today) {
    return "선적대기중";
  }

  // 나머지 → 운항중
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
          <Typography sx={{ fontWeight: "bold", fontSize: 18 }}>
            ※ 과부족 상태 ※
          </Typography>

          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                {["품목", "기존재고", "적정재고", "과부족 상태"].map((h) => (
                  <TableCell
                    key={h}
                    sx={{ fontWeight: "bold", fontSize: 15, bgcolor: "#f0f0f0" }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {[
                { name: "PLUG", current: 1200, proper: 1000 },
                { name: "GASKET", current: 600, proper: 900 },
                { name: "DOWEL PIN", current: 200, proper: 300 }
              ].map((row) => {
                const status = getStatus(row.current, row.proper);
                return (
                  <TableRow key={row.name}>
                    <TableCell sx={{ fontWeight: "bold" }}>{row.name}</TableCell>
                    <TableCell>{row.current.toLocaleString()}</TableCell>
                    <TableCell>{row.proper.toLocaleString()}</TableCell>
                    <TableCell>
                      
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

  {/* 🔥🔥 이 부분 추가!! */}
  <HorizontalScroll>
    <Box sx={{ minWidth: 4000 }}> 
      {/* ← 여기에서 전체 테이블 가로 사이즈 확보 (28개 품목 때문에 길어짐) */}

      <Table size="small" sx={{ mt: 2 }}>
        <TableHead sx={{ bgcolor: "#ffe599" }}>
          <TableRow>
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
