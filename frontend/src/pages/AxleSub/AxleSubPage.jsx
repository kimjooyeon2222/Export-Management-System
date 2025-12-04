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



export default function AxleSubPage() {

   
    const saveSetting = async () => {
  await fetch(`${API_BASE}/api/axle-setting`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target_stock: targetStockSetting,
      writer,
      us_date: usDate
    })
  });
};

    const fetchSetting = async () => {
  const res = await fetch(`${API_BASE}/api/axle-setting`);
  const data = await res.json();

  setTargetStockSetting(data.target_stock);
  setWriter(data.writer);
  setUsDate(data.us_date);
};

const [targetStockSetting, setTargetStockSetting] = useState(0);
    // 🔥 targetStockSetting 변경 시 모든 행의 target_stock를 자동 갱신
useEffect(() => {
  setAxleRows(prev =>
    prev.map(row => ({
      ...row,
      target_stock: targetStockSetting
    }))
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
const fetchScheduleData = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/axle-schedule`);
    const data = await res.json();
    setScheduleRows(data);
  } catch (err) {
    console.error("AXLE 스케줄 로드 오류:", err);
  }
};


   

  const API_BASE = import.meta.env.VITE_API_URL;

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
    const res = await fetch(`${API_BASE}/api/axle`);
    const data = await res.json();
    setAxleRows(data);
  } catch (err) {
    console.error("AXLE 데이터 로드 오류:", err);
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
  const saveAxleData = async () => {
  try {
    // 1) AXLE 재고 저장
    for (let row of axleRows) {
      // 🔥 row마다 updated_at 제거
      const cleanRow = { ...row };
      delete cleanRow.updated_at;

      await fetch(`${API_BASE}/api/axle/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanRow)
      });
    }

    // 2) 전역 설정(적정재고, 작성자, 날짜) 저장
    await saveSetting();

    alert("저장 완료!");
    setEditMode(false);

    // 최신 데이터 다시 불러오기
    fetchAxleData();
    fetchSetting();

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
        row.id === id ? { ...row, [field]: value } : row
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
  <Typography sx={{ fontSize: 16, fontWeight: "bold", ml: 1 }}>
    기준: {targetStockSetting}
  </Typography>
)}

  
</Box>

 {/* 🔥 우측 상단 행추가/행삭제 버튼 */}
    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, gap: 1 }}>
      <Button
        variant="contained"
        color="success"
        size="small"
        disabled={!editMode}
        onClick={() => {
          setAxleRows(prev => [
            ...prev,
            {
              id: Date.now(),
              company: "",
              item_name: "",
              item_code: "",
              box_qty: 0,
              actual_stock: 0,
              target_stock: targetStockSetting
            }
          ]);
        }}
      >
        + 행추가
      </Button>

      <Button
        variant="contained"
        color="error"
        size="small"
        disabled={!editMode}
        onClick={() => {
          setAxleRows(prev => prev.slice(0, -1));
        }}
      >
        - 행삭제
      </Button>
    </Box>

    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>업체명</TableCell>
          <TableCell>품명</TableCell>
          <TableCell>품번</TableCell>
          <TableCell>박스 입수량</TableCell>
          <TableCell>실사자료</TableCell>
          <TableCell>적정재고</TableCell>
          <TableCell>운항중</TableCell>
          <TableCell>기존재고</TableCell>
          <TableCell>운항중 + 기존재고</TableCell>
          <TableCell>판단결과</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {axleRows.map((row) => {
          const inTransit = 0;
const total = row.actual_stock + inTransit;

return (
  <TableRow key={row.id}>
    <TableCell>{row.company}</TableCell>
    <TableCell>{row.item_name}</TableCell>
    <TableCell>{row.item_code}</TableCell>
    <TableCell>{row.box_qty}</TableCell>

    <TableCell>
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
    <span>{row.actual_stock}</span>
  )}
</TableCell>


   


    <TableCell>{targetStockSetting}</TableCell>


    <TableCell>{row.actual_stock}</TableCell>
    <TableCell>{total}</TableCell>

    <TableCell
  sx={{
    color: statusColor(getStatus(row.actual_stock, targetStockSetting)),
    fontWeight: "bold"
  }}
>
  {getStatus(row.actual_stock, targetStockSetting)}
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
    { id: uuidv4(), inv_no: "NEW" } // ★ inv_no 빈값 금지
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
        onClick={() =>
          setScheduleRows(prev => prev.slice(0, -1))
        }
      >
        - 행삭제
      </Button>
    </Box>
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell>INV</TableCell>
        <TableCell>NO</TableCell>
        <TableCell>ETD</TableCell>
        <TableCell>ETA</TableCell>
        <TableCell>상태</TableCell>
      </TableRow>
    </TableHead>

    <TableBody>
      {scheduleRows.map(row => (
        <TableRow key={row.id}>
  <TableCell>{row.inv_no}</TableCell>
  <TableCell>{row.created_at?.slice(0, 10)}</TableCell>
</TableRow>

      ))}
    </TableBody>
  </Table>
</Paper>

    </Box>
  );
}
