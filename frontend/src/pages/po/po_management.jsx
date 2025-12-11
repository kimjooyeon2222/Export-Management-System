// src/pages/po/po_management.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";

export default function POManagementPage() {
  // 날짜 형식 변환: YYYY-MM-DD → MM-DD (요일)
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";

  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;

  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[d.getDay()];

  return `${month}월 ${day}일 (${weekday})`;
};


  /* ----------------------------------
        상태
  ---------------------------------- */
  const [editMode, setEditMode] = useState(false);
  const [usDate, setUsDate] = useState(""); // 북미 기준 날짜(제목용)
  const [showIncomingOnly, setShowIncomingOnly] = useState(false);

  const [poRows, setPoRows] = useState([
    {
  id: uuidv4(),
  po_no: "",
  order_date: "",
  request_date: "",
  ototek_date: "",
  manager: "",
  company: "",   // ⭐ 추가된 업체 컬럼
  subject: "",
  method: "해운"
}

  ]);

  /* ----------------------------------
        제목 자동 생성
  ---------------------------------- */
  const getHeaderTitle = () => {
    if (!usDate) return "PO# INFO";
    const d = new Date(usDate);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    return `PO# INFO (${y}년  ${m}월)`;
  };

  /* ----------------------------------
        날짜/남은일수 계산
  ---------------------------------- */
  const todayUS = () => {
    const now = new Date().toLocaleString("en-US", {
      timeZone: "America/Chicago"
    });
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const calcRemainingDays = (targetDate) => {
    if (!targetDate) return "";
    const t = todayUS();
    const d = new Date(targetDate);
    const diff = Math.ceil((d - t) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getRemainingStyle = (days) => {
  if (days >= 1 && days <= 45) {
    return {
      backgroundColor: "#f4cccc",
      color: "#990000",
      borderRadius: "12px",
      padding: "4px 10px",
      fontWeight: "bold",
      display: "inline-block",   // ⭐ 셀 전체가 아니라 글자만 감싸지게
      minWidth: "40px",
      textAlign: "center"
    };
  }
  return {};
};



const isToday = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return false;

  // 날짜 형식이 YYYY-MM-DD인지 체크
  const trimmed = dateStr.slice(0, 10);

  // new Date() 유효성 검사
  const parsed = new Date(trimmed);
  if (isNaN(parsed)) return false;

  const todayKR = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  }); // 한국 날짜 YYYY-MM-DD

  return trimmed === todayKR;
};



  const getOrderDateStyle = (dateStr) => {
  return isToday(dateStr)
    ? {
        backgroundColor: "#d9ead3", // 색은 기존 초록색 유지
        fontWeight: "bold",
        borderRadius: "12px",       // pill 형태
        padding: "4px 10px",        // 남은일수와 동일 padding
        display: "inline-block",    // 전체 칸이 아니라 text만 칠해짐
        textAlign: "center"
      }
    : {};
};

  /* ----------------------------------
        운송방법 색상
  ---------------------------------- */
  const shippingColor = {
    해운: "#5bc0de",
    항공: "#ffd966",
    팀트럭: "#38761d"
  };

  const getShipStyle = (method) => ({
    backgroundColor: shippingColor[method] || "#eee",
    color: method === "팀트럭" ? "#fff" : "#000",
    padding: "3px 8px",
    borderRadius: "6px",
    fontWeight: "bold",
    display: "inline-block"
  });

  /* ----------------------------------
        함수
  ---------------------------------- */
  const addRow = () => {
    if (!editMode) return;
    setPoRows((prev) => [
      ...prev,
      {
  id: uuidv4(),
  po_no: "",
  order_date: "",
  request_date: "",
  ototek_date: "",
  manager: "",
  company: "",
  subject: "",
  method: "해운"
      }
    ]);
  };

  const deleteRow = () => {
    if (!editMode || poRows.length <= 1) return;
    setPoRows((prev) => prev.slice(0, -1));
  };

  const updateCell = (id, field, value) => {
    setPoRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const filteredRows = poRows;  


  /* ----------------------------------
        UI 렌더링
  ---------------------------------- */

  return (
    <Box sx={{ p: 3 }}>

      {/* 상단 버튼 영역 */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ fontSize: 22, fontWeight: "bold" }}>
          {getHeaderTitle()}
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setEditMode(!editMode)}
            sx={{ fontWeight: "bold" }}
          >
            {editMode ? "수정모드 종료" : "수정모드 활성화"}
          </Button>

          <Button variant="contained" disabled={!editMode}>
            저장
          </Button>

         
        </Box>
      </Box>

      {/* 날짜 입력 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2,mt:1 }}>
        <TextField
          label="북미 기준 날짜 (YYYY-MM-DD)"
          size="small"
          value={usDate}
          onChange={(e) => editMode && setUsDate(e.target.value)}
          InputProps={{ readOnly: !editMode }}
          sx={{ width: 200 }}
        />
      </Box>

      {/* 필터 버튼 */}
      <Button
        variant="outlined"
        sx={{ mb: 2 , fontWeight:"bold", fontSize:"15px"}}
        onClick={() => setShowIncomingOnly((prev) => !prev)}
      >
       도착예정 필터
      </Button>
{/* 행추가 / 행삭제 버튼: Paper 위 오른쪽 정렬 */}
<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1, mb: 1 }}>
  <Button
    variant="contained"
    color="success"
    disabled={!editMode}
    onClick={addRow}
    sx={{ mr: 1 }}
  >
    + 행추가
  </Button>

  <Button
    variant="contained"
    color="error"
    disabled={!editMode}
    onClick={deleteRow}
  >
    - 행삭제
  </Button>
</Box>

      {/* 메인 테이블 */}
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead
  sx={{
    bgcolor: "#e6f3ff",
    "& th": {
      fontWeight: "bold",
      fontSize: "15px"
    }
  }}
>
            <TableRow>

              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>PO#</TableCell>
              {!showIncomingOnly && (
  <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>북미 발주일자</TableCell>
)}
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>북미도착 요청일자(A)</TableCell>
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>오토텍 발주일자</TableCell>
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>(A)-(금일) 남은 일수</TableCell>
              {/* 담당자 숨김 */}
{!showIncomingOnly && (
  <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>담당자</TableCell>
)}

{/* ⭐ 업체는 항상 표시 */}
<TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>업체</TableCell>

{/* 결재목차 + 운송방법 숨김 */}
{!showIncomingOnly && (
  <>
    <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>결재 목차</TableCell>
    <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>운송 방법</TableCell>
  </>
)}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredRows.map((row) => {
              const days = calcRemainingDays(row.request_date);

              return (
                <TableRow key={row.id} sx={{ height: 42, fontWeight:"bold", fontSize:"15px"}}>

                  
                 

                  {/* PO 번호 */}
                  <TableCell align="center" sx={{ py: 1.2 ,fontWeight:"bold", fontSize:"15px"}}>

                    {editMode ? (
                      <TextField
                        size="small"
                        value={row.po_no}
                        onChange={(e) =>
                          updateCell(row.id, "po_no", e.target.value)
                        }
                      />
                    ) : (
                      row.po_no
                    )}
                  </TableCell>

                  {/* 북미발주일자 (오늘이면 강조) */}
                  {!showIncomingOnly && (
 <TableCell
  align="center"
  sx={{
    py: 1.2,
    fontWeight: "bold",
    fontSize: "15px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }}
>
  {editMode ? (
    <TextField
      size="small"
      value={row.order_date}
      onChange={(e) => updateCell(row.id, "order_date", e.target.value)}
    />
  ) : (
    <Box sx={getOrderDateStyle(row.order_date)}>
      {formatDisplayDate(row.order_date)}
    </Box>
  )}
</TableCell>

)}

               <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>
  {editMode ? (
    <TextField
      size="small"
      value={row.request_date}
      onChange={(e) =>
        updateCell(row.id, "request_date", e.target.value)
      }
    />
  ) : (
    formatDisplayDate(row.request_date)
  )}
</TableCell>


                  {/* 오토텍발주일자 */}
                 <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>
  {editMode ? (
    <TextField
      size="small"
      value={row.ototek_date}
      onChange={(e) => updateCell(row.id, "ototek_date", e.target.value)}
    />
  ) : (
    formatDisplayDate(row.ototek_date)
  )}
</TableCell>

                  {/* 남은일수 */}
                  <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>
                    <Box sx={getRemainingStyle(days)}>{days}</Box>
                  </TableCell>

                  {/* 담당자 */}
                  {!showIncomingOnly && (
  <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>
    {editMode ? (
      <TextField
        size="small"
        value={row.manager}
        onChange={(e) => updateCell(row.id, "manager", e.target.value)}
      />
    ) : (
      row.manager
    )}
  </TableCell>
)}
                  <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>
  {editMode ? (
    <TextField
      size="small"
      value={row.company}
      onChange={(e) => updateCell(row.id, "company", e.target.value)}
    />
  ) : (
    row.company
  )}
</TableCell>


                  {/* 결재 목차 */}
                  {!showIncomingOnly && (
  <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>
    {editMode ? (
      <TextField
        size="small"
        value={row.subject}
        onChange={(e) => updateCell(row.id, "subject", e.target.value)}
      />
    ) : (
      row.subject
    )}
  </TableCell>
)}


                  {/* 운송방법 */}
                 {!showIncomingOnly && (
  <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>
    {editMode ? (
      <Select sx={{fontWeight:"bold", fontSize:"15px"}}
        size="small"
        value={row.method}
        onChange={(e) =>
          updateCell(row.id, "method", e.target.value)
        }
      >
        <MenuItem value="해운" sx={{fontWeight:"bold", fontSize:"15px"}}>해운</MenuItem>
        <MenuItem value="항공" sx={{fontWeight:"bold", fontSize:"15px"}}>항공</MenuItem>
        <MenuItem value="팀트럭" sx={{fontWeight:"bold", fontSize:"15px"}}>팀트럭</MenuItem>
      </Select>
    ) : (
      <Box sx={getShipStyle(row.method)}>{row.method}</Box>
    )}
  </TableCell>
)}

                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
