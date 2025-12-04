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

export default function AxleSubPage() {
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


    const statusColor = (status) => {
  switch (status) {
    case "초과": return "purple";
    case "적정재고미달": return "orange";
    case "양호": return "green";
    default: return "black";
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

  }, []);

  // ===============================
  // 🔥  AXLE 항목 저장
  // ===============================
  const saveAxleData = async () => {
    try {
      for (let row of axleRows) {
        await fetch(`${API_BASE}/api/axle/${row.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row)
        });
      }

      alert("저장 완료!");
      setEditMode(false);
      fetchAxleData();

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
   
    <Typography sx={{ fontWeight: "bold", fontSize: 18, mb: 1 }}>
      ※ 과부족 상태 ※
    </Typography>
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
              target_stock: 0
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
      <TextField
        size="small"
        type="number"
        value={row.actual_stock}
        onChange={(e) =>
          editMode &&
          updateCell(row.id, "actual_stock", Number(e.target.value))
        }
        InputProps={{ readOnly: !editMode }}
        sx={{ width: 90 }}
      />
    </TableCell>

    <TableCell>
      <TextField
        size="small"
        type="number"
        value={row.target_stock}
        onChange={(e) =>
          editMode &&
          updateCell(row.id, "target_stock", Number(e.target.value))
        }
        InputProps={{ readOnly: !editMode }}
        sx={{ width: 90 }}
      />
    </TableCell>

    <TableCell>{inTransit}</TableCell>
    <TableCell>{row.actual_stock}</TableCell>
    <TableCell>{total}</TableCell>

    <TableCell
      sx={{
        color: row.actual_stock >= row.target_stock ? "green" : "orange",
        fontWeight: "bold"
      }}
    >
      {row.actual_stock >= row.target_stock ? "양호" : "적정재고미달"}
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
            { id: uuidv4(), inv_no: "" }
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
