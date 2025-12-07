import React, { useState } from "react";
import { 
  Box,
  Typography,
  TextField,
  Button,
  Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function EvSubPage() {
  const navigate = useNavigate();

  // 수정모드 ON/OFF
  const [editMode, setEditMode] = useState(false);

  // 작성자 + 북미 날짜
  const [writer, setWriter] = useState("");
  const [usDate, setUsDate] = useState("");

  // 과부족 패널 토글
  const [showStockPanel, setShowStockPanel] = useState(false);

  // "11월 초" 같은 텍스트 변환
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

      {/* 과부족 패널 */}
      {showStockPanel && (
        <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
          <Typography sx={{ fontWeight: "bold", fontSize: 18 }}>
            ※ 과부족 상태 ※
          </Typography>

          <Box sx={{ p: 3, color: "#555" }}>
            (여기에 과부족 상태표가 들어갑니다)
          </Box>
        </Paper>
      )}

      {/* 운송 스케줄 패널 */}
      <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
        <Typography sx={{ fontWeight: "bold", fontSize: 18 }}>
          ※ 운송 스케줄 현황 ※
        </Typography>

        <Box sx={{ p: 3, color: "#555" }}>
          (여기에 운송 스케줄 테이블이 들어갑니다)
        </Box>
      </Paper>
    </Box>
  );
}
