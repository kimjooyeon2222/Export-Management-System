import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";



export default function ForgingPage() {
  const getForgingJudgeStyle = (status) => {
  switch (status) {
    case "초과":
      return {
        bgcolor: "#ead1dc",     // 연보라 배경
        color: "#99004d",       // 진보라 글씨
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
        bgcolor: "#fff2cc",      // 연노랑 배경
        color: "#7f6000",        // 갈색 글씨
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


function formatKRDate(date) {
  const local = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return local.toISOString().split("T")[0];
}


  const [showStockPanel, setShowStockPanel] = useState(false);

// 📌 미국 Alabama(중부시간) 기준 '오늘 00:00' 생성
function todayUS() {
  const nowUS = new Date().toLocaleString("en-US", {
    timeZone: "America/Chicago",
  });

  const d = new Date(nowUS);
  d.setHours(0, 0, 0, 0);
  return d;
}



  function normalizeRow(row) {
  return {
    ...row,

    mq4_gear:
      row.mq4_gear === "" ||
      row.mq4_gear === null ||
      row.mq4_gear === undefined
        ? null
        : Number(row.mq4_gear),

    mq4_pinion:
      row.mq4_pinion === "" ||
      row.mq4_pinion === null ||
      row.mq4_pinion === undefined
        ? null
        : Number(row.mq4_pinion),

    nx4_gear:
      row.nx4_gear === "" ||
      row.nx4_gear === null ||
      row.nx4_gear === undefined
        ? null
        : Number(row.nx4_gear),

    nx4_pinion:
      row.nx4_pinion === "" ||
      row.nx4_pinion === null ||
      row.nx4_pinion === undefined
        ? null
        : Number(row.nx4_pinion),
  };
}



  const FIELD_MAP = {
  "MQ4 GEAR-DRIVEN": "mq4_gear",
  "MQ4 PINION-DRIVE": "mq4_pinion",
  "NX4 GEAR-DRIVEN": "nx4_gear",
  "NX4 PINION-DRIVE": "nx4_pinion",
};

const getEtaStyle = (status) => {
  if (status === "운항중") {
    return {
      bgcolor: "#ffe6f1",   // 분홍 배경
      color: "#c41d7f",     // 빨간 글씨
      fontWeight: "bold",
      borderRadius: "6px",
      px: 1
    };
  }
  return {};
};


const [editMode, setEditMode] = useState(false);
const API_BASE = import.meta.env.VITE_API_URL;
const navigate = useNavigate();

//  stock-setting 불러오기
useEffect(() => {
  async function loadStockSetting() {
    try {
      const res = await fetch(`${API_BASE}/api/stock-setting`);
      const data = await res.json();

      if (data) {
        setTargetStock(data.target_stock || 30000);
        setWriter(data.writer || "");

        // 날짜를 YYYY-MM-DD로 변환
        if (data.us_date) {
          const onlyDate = new Date(data.us_date).toISOString().split("T")[0];
          setUsDate(onlyDate);
        } else {
          setUsDate("");
        }
      }
    } catch (err) {
      console.error("stock-setting load error", err);
    }
  }

  loadStockSetting();
}, []);



  useEffect(() => {
  async function loadItems() {
    const res = await fetch(`${API_BASE}/api/stock-items`);
    const dbItems = await res.json();

    if (Array.isArray(dbItems)) {
      setItems(prev =>
        prev.map(p => {
          const found = dbItems.find(d => d.item_name === p.name);
          if (!found) return p;

          return {
            ...p,
            overStock: found.over_stock,
            defect: found.defect,
            normalStock: found.normal_stock
          };
        })
      );
    }
  }

  loadItems();
}, []);

function parseUSDate(dateValue) {
  if (!dateValue) return null;

  const [y, m, d] = dateValue.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 6, 0, 0)); // 미국 00:00 = UTC+6
}

function parseKRDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, -9, 0, 0));  // 한국 00시 고정
}



useEffect(() => {
  async function loadRows() {
    const res = await fetch(`${API_BASE}/api/schedule-rows`);
    const dbRows = await res.json();

    const fixedRows = dbRows.map(r => {
      const etd = parseKRDate(r.etd);
      const eta = parseUSDate(r.eta);


      return {
        ...r,
        etd,
        eta
      };
    });

    const today = todayUS();

    const recalculated = fixedRows.map(r => {
      const etdDate = r.etd;
      const etaDate = r.eta;

      let status = "";

      // ETA 없으면 부산항 미입고
      if (!etaDate) {
        status = "부산항 미입고";
      }
      // ETA 지났으면 입고완료      
      else if (etaDate <= today) {
        status = "입고완료";
      }
      // ETD가 있고 미래면 선적대기중
      else if (etdDate && etdDate > today) {
        status = "선적대기중";
      }
      // 나머지는 운항중
      else {
        status = "운항중";
      }

      return { ...r, status };
    });

    setRows(recalculated);
    updateRunningTotals(recalculated);
  }

  loadRows();
}, []);




const [writer, setWriter] = useState("");
const [usDate, setUsDate] = useState("");  // YYYY-MM-DD
const getPeriod = (dateStr) => {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let period = "";

  if (day <= 10) period = "초";
  else if (day <= 20) period = "중순";
  else period = "말";

  return `${month}월 ${period}`;
};

const getKoreanMonthLabel = (dateStr) => {
  if (!dateStr) return "실사자료"; // 날짜 없으면 기본값
  const d = new Date(dateStr);
  const year = d.getFullYear() % 100;
  const month = d.getMonth() + 1;
  return `${year}년 ${month}월 실사자료`;
};



  /* ===============================
      🔶 상태값
  =============================== */
  const [targetStock, setTargetStock] = useState(30000);
// 🔹 1) 운항중 합계 자동 계산
const updateRunningTotals = (rows) => {
  setItems(prev =>
    prev.map(item => {
      const field = FIELD_MAP[item.name];   // ⭐ 올바른 필드 매핑

      const total = rows.reduce((sum, r) => {
        // 🚀 STATUS가 '운항중'인 행만 합산
        if (r.status === "운항중") {
          const val = Number(r[field] || 0);   // ⭐ 여기만 고치면 해결

          return sum + val;
        }
        return sum;
      }, 0);

      return { ...item, running: total };
    })
  );
};

// 🔹 2) 정상재고 자동 계산 (기존재고 - 불량)
const updateNormalStock = () => {
  setItems(prev =>
    prev.map(it => ({
      ...it,
      normalStock: Number(it.overStock) - Number(it.defect || 0)
    }))
  );
};

  // 품목 데이터
  const [items, setItems] = useState([
  {
    name: "MQ4 GEAR-DRIVEN",
    fullName: "MQ4 GEAR-DRIVEN (G53212-T0770E)",
    running: 0,
    overStock: 61000,
    defect: 0,
    normalStock: 61000,
    unit: 7500
  },
  {
    name: "MQ4 PINION-DRIVE",
    fullName: "MQ4 PINION-DRIVE (G53211-T08280Y)",
    running: 0,
    overStock: 23500,
    defect: 0,
    normalStock: 23500,
    unit: 4000
  },
  {
    name: "NX4 GEAR-DRIVEN",
    fullName: "NX4 GEAR-DRIVEN (53032-4G25B)",
    running: 0,
    overStock: 38500,
    defect: 0,
    normalStock: 38500,
    unit: 4000
  },
  {
    name: "NX4 PINION-DRIVE",
    fullName: "NX4 PINION-DRIVE (53031-4G25B)",
    running: 0,
    overStock: 51500,
    defect: 0,
    normalStock: 51500,
    unit: 4000
  }
]);



  /* ===============================
      🔶 엑셀 과부족 판정 수식 그대로 (D6 = 기준재고초과)
  =============================== */
  const judgeStatus = (d6, d4) => {
    if (d6 >= d4 * 1.13) return "초과";
    if (d6 >= d4 && d6 > d4 * 0.96) return "양호";
    if (d6 <= d4 * 0.7) return "위험";
    return "적정재고미달";
  };

  /* ===============================
      🔶 엑셀 가감필요횟수 수식 그대로
  =============================== */
  const calcAdjust = (d6, d4, unit) => {
    const diff = (d6 - d4) / unit;
    if (diff <= 0.7) return -Math.ceil(diff);
    return -Math.floor(diff);
  };

  /* ===============================
      🔶 운송 스케줄 row
  =============================== */
  const [rows, setRows] = useState([]);

  

  /* ===============================
      🔶 month 자동 계산
  =============================== */
  // 숫자에 콤마( , ) 붙여서 예쁘게 보여주는 함수
const fmt = (n) => {
  if (n === null || n === undefined || n === "") return "";
  return Number(n).toLocaleString("en-US");
};

// 운항여부 스타일 함수
const getStatusStyle = (status) => {
  if (status === "입고완료") {
    return {
      bgcolor: "#d9f7be",   // 연두배경
      color: "#237804",     // 초록글씨
      fontWeight: "bold",
      borderRadius: "6px",
      px: 1
    };
  }

  if (status === "운항중") {
    return {
      bgcolor: "#ffe6f1",   // 분홍배경
      color: "#c41d7f",     // 빨간글씨
      fontWeight: "bold",
      borderRadius: "6px",
      px: 1
    };
  }

  return {};
};



  return (
    
    <Box sx={{ p: 3 }}>
      {/* ← 메인으로 버튼 */}
<Box sx={{ mb: -4 }}>
  <Button
    variant="outlined"
    onClick={() => navigate("/")}
    sx={{
      borderColor: "#0069a6ff",     // 갈색 테두리
      color: "#0056a6ff",           // 텍스트 색
      backgroundColor: "#ffffff", // 흰색 배경
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

  {/* 🔥 저장 버튼 (DB 저장) */}

<Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, gap:1 }}>
    {/* 🔧 수정모드 버튼 */}
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
    onClick={async () => {
      const formattedUsDate = usDate ? new Date(usDate).toISOString().split("T")[0] : null;

      try {
        // 1) stock_setting 저장
        await fetch(`${API_BASE}/api/stock-setting`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_stock: targetStock,
            writer,
            us_date:formattedUsDate
          })
        });

        // 2) stock_items 저장
        await fetch(`${API_BASE}/api/stock-item/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items)
        });
        
        const cleanRows = rows.map(normalizeRow);

        // 3) schedule_rows 저장 ← 여기 핵심!!
        await fetch(`${API_BASE}/api/schedule-row/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
         body: JSON.stringify(cleanRows)
        });

        alert("저장 완료되었습니다!");
      } catch (e) {
        console.error(e);
        alert("저장 실패!");
      }
    }}
  >
    저장
  </Button>
</Box>


{/* 작성자 + 북미 날짜 */}
<Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 1 }}>

  {/* 작성자 */}
  <TextField
    label="작성자"
    InputProps={{
      readOnly: !editMode,
      sx: {
        "& input": {
          fontSize: "14px",        // 입력 글자 크기
          fontWeight: "bold",      // 입력 Bold
        }
      }
    }}
    InputLabelProps={{
      shrink: true,
      sx: {
        fontSize: "15px",          // 라벨 크기
        fontWeight: "bold"         // 라벨 Bold
      }
    }}
    size="small"
    value={writer}
    onChange={(e) => {
      if (!editMode) return;
      setWriter(e.target.value);
    }}
    sx={{ width: 160 }}
  />

  {/* 북미 날짜 */}
  <TextField
    label="북미 기준 날짜 (YYYY-MM-DD)"
    size="small"
    placeholder="2025-11-03"
    value={usDate}
    InputProps={{
      readOnly: !editMode,
      sx: {
        "& input": {
          fontSize: "14px",        // 입력 글씨 크기
          fontWeight: "bold",      // Bold
        }
      }
    }}
    InputLabelProps={{
      shrink: true,
      sx: {
        fontSize: "15px",          // 라벨 글씨 크기
        fontWeight: "bold"         // Bold
      }
    }}
    onChange={(e) => {
      if (!editMode) return;
      setUsDate(e.target.value);
    }}
    sx={{ width: 200 }}
  />

</Box>


      {/* ======================
    페이지 제목 + 토글 버튼
======================= */}
<Box sx={{ 
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "center",
  mb: 3
}}>
  
  {/* 제목 */}
  <Typography variant="h5" sx={{ fontSize: 18, fontWeight: "bold" }}>
    원소재 재고 파악 및 운송일정 관리 
    ({usDate ? getPeriod(usDate) : "작성일자"})
  </Typography>

  {/* 🔥 우측 상단 토글 버튼 */}
  <Button
    size="small"
    variant="outlined"
    onClick={() => setShowStockPanel(prev => !prev)}
    sx={{
      fontSize: "14px",
      fontWeight: "bold",
      mb:-1,
      mt:2,
    }}
  >
    {showStockPanel ? "− 접기" : "+ 과부족 상태표 보기"}
  </Button>

</Box>



 {/* 과부족 상태 패널 (T 제외 → 4개만 출력) */}
      
  {showStockPanel && (
     
      <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
 
  {/* 🔥 가로 한 줄, 왼쪽 정렬 */}
  <Box 
    sx={{ 
      display: "flex",
      alignItems: "center",
      gap: 3,   // ← 제목과 기준 사이 간격
      mb: 2
    }}
  >
    {/* 왼쪽: 제목 */}
    <Typography sx={{ fontWeight: "bold", fontSize: "18px" }}>
      ※ 과부족 상태 ※
    </Typography>

    {/* 오른쪽: 적정재고 기준 (제목 바로 옆) */}
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography sx={{ fontSize: "15px", fontWeight: "bold", color: "#777" }}>
  적정재고 기준:
</Typography>


      {editMode ? (
        <TextField
          type="number"
          size="small"
          value={targetStock}
          onChange={(e) => setTargetStock(Number(e.target.value))}
          sx={{
            width: 120,
            "& input": {
              textAlign: "center",
              fontWeight: "bold",
              color: "#777", 
            },
          }}
        />
      ) : (
        <Typography sx={{ fontSize: "17px", fontWeight: "bold", color:"#777" }}>
          {fmt(targetStock)}
        </Typography>
      )}
    </Box>
  </Box>


        <Table size="small">
          <TableHead sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000" }}>
  <TableRow>
    {[
      "품목",
      getKoreanMonthLabel(usDate),   // 예: 25년 11월 실사자료
      "불량/발청 소재",
      "적정재고",
      "운항중",
      "기존재고-불량",
      "운항중+정상재고",
      "판정"
    ].map(h => (
      <TableCell
        key={h}
        align="center"
        sx={{ fontWeight: "bold", fontSize: 14 }}
      >
        {h}
      </TableCell>
    ))}
  </TableRow>
</TableHead>

<TableBody>
  {items.slice(0, 4).map((it, idx) => {
    const normal = it.normalStock;
    const after = it.running + normal;
    const status = judgeStatus(normal, targetStock);

    return (
      <TableRow key={idx}>
        
        {/* 품목명 */}
        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
          {it.fullName}
        </TableCell>

        {/* 실사자료 수량 */}
        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
          {editMode ? (
            <TextField
              type="number"
              variant="standard"
              value={it.overStock}
              onChange={(e) => {
                const v = Number(e.target.value);

                setItems(prev =>
                  prev.map((p, i) =>
                    i === idx ? { ...p, overStock: v } : p
                  )
                );

                updateNormalStock();
              }}
              sx={{
                width: 80,
                "& input": {
                  textAlign: "center",
                  fontSize: 15,
                  fontWeight: "bold",
                  color: "#1155cc"
                }
              }}
            />
          ) : (
            fmt(it.overStock)
          )}
        </TableCell>

        {/* 불량/발청 소재 */}
        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
          {editMode ? (
            <TextField
              type="number"
              variant="standard"
              value={it.defect}
              onChange={(e) => {
                const v = Number(e.target.value);

                setItems(prev =>
                  prev.map((p, i) =>
                    i === idx ? { ...p, defect: v } : p
                  )
                );

                updateNormalStock();
              }}
              sx={{
                width: 80,
                "& input": {
                  textAlign: "center",
                  fontSize: 15,
                }
              }}
            />
          ) : (
            fmt(it.defect)
          )}
        </TableCell>

        {/* 적정재고 */}
        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
          {fmt(targetStock)}
        </TableCell>

        {/* 운항중 */}
        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
          {fmt(it.running)}
        </TableCell>

        {/* 기존재고 - 불량 */}
        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
          {fmt(normal)}
        </TableCell>

        {/* 운항중 + 정상재고 */}
        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
          {fmt(after)}
        </TableCell>

        {/* 판정 */}
        <TableCell align="center">
  <Box sx={getForgingJudgeStyle(status)}>
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
      {/* ===============================
    🔶 과부족 아래 전체 (요구사항 반영 완성본)
=============================== */}
<Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
{/* 제목 영역 */}
<Box sx={{ mb: 2 }}>
  <Typography sx={{ fontWeight: "bold", fontSize: "18px", mt:1 }}>
    ※ 운송 스케줄 현황 ※
  </Typography>
</Box>

  {/* 🔹 엑셀 ROUNDUP 구현 */}
  {(() => {
    window.excelRoundUp = (v) => (v >= 0 ? Math.ceil(v) : -Math.ceil(Math.abs(v)));
    return null;
  })()}

  {/* 🔹 가감필요 계산 */}
  {(() => {
    window.calcAdjustExcel = (real, target, unit) => {
      const diff = (real - target) / unit;
      return diff <= 0.7 ? -window.excelRoundUp(diff) : -Math.floor(diff);
    };
    return null;
  })()}


  {/* ===============================  
      🔶 행추가 버튼  
  =============================== */}
  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, mb: 1, gap:1 }}>
    <Button
      variant="contained"
      color="success"
      size="small"
      disabled={!editMode}   // ⭐ 추가
      onClick={() =>
        setRows((prev) => [
          ...prev,
          {
            id:uuidv4(),
            inv_no: "",
            no: "",
            status: "",
            etd: "",
            eta: "",
            month_depart: "",
            month_arrive: "",
          },
        ])
      }
    >
      + 행추가         
    </Button>
    
    {/* 🔥 행삭제(마지막 행 삭제 버튼) */}
  <Button
    variant="contained"
    color="error"
    size="small"
    disabled={!editMode}  

    onClick={() =>
      setRows((prev) => {
        if (prev.length === 0) return prev;

        const newRows = prev.slice(0, -1);

        // ⭐ 삭제 후 running 재계산
        updateRunningTotals(newRows);

        return newRows;
      })
    }
  >
    - 행삭제
  </Button>
  </Box>

  {/* ===============================  
      🔶 3단: 운송 스케줄 테이블  
  =============================== */}
  <Table size="small" sx={{ mt: 1, borderCollapse: "collapse" }}>
    <TableHead sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000" }}>
      <TableRow>
        {[
          "INV#",
          "NO",
          "운항여부",
          ...items.map((it) => it.name),
          "ETD",
          "ETA",
          "선적월",
          "도착월",
        ].map((h) => (
          <TableCell key={h} align="center" sx={{ fontWeight: "bold", fontSize: "14px" }}>
            {h}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>

    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.id}>

          {/* 🔹 INV 입력 → 자동 매핑 */}
          <TableCell align="center">
            <TextField
             InputProps={{ readOnly: !editMode }}
              variant="standard"
              value={row.inv_no || ""}
              onChange={async (e) => {
  if (!editMode) return;

  const inv = e.target.value;

  // 1️⃣ 입력 즉시 반영 (지울 때도 포함)
  setRows(prev =>
    prev.map(r =>
      r.id === row.id ? { ...r, inv_no: inv } : r
    )
  );

  // 2️⃣ inv가 비었으면 아래 로직 중단 (API 호출 X)
  if (inv.trim() === "") {
    // 상태도 초기화
    setRows(prev =>
      prev.map(r =>
        r.id === row.id
          ? {
              ...r,
              no: "",
              status: "",
              etd: "",
              eta: "",
              month_depart: "",
              month_arrive: "",
            }
          : r
      )
    );

    updateRunningTotals(rows);
    return;
  }

  // 3️⃣ 정상 입력일 때만 API 호출
  try {
    const res = await fetch(`${API_BASE}/api/invoice/${inv}`);
    const data = await res.json();

    const today = todayUS();
    const etd = data?.etd ? parseKRDate(data.etd) : null;
    const eta = data?.eta ? parseUSDate(data.eta) : null;


    let status = "";

if (!data?.eta || data.eta === "일정 없음") {
  status = "부산항 미입고";
} 
else {
  const etdDate = data?.etd ? parseKRDate(data.etd) : null;
  const etaDate = data?.eta ? parseUSDate(data.eta) : null;
  const today = todayUS();

  if (etaDate <= today) {
    status = "입고완료";
  } else if (etdDate > today) {
    status = "선적대기중";
  } else {
    status = "운항중";
  }
}


    // 4️⃣ 입력된 INV에 대한 데이터 반영
    setRows(prev => {
      const newRows = prev.map(r =>
        r.id === row.id
          ? {
              ...r,
              no: data?.no || "",
              status,
              etd: data?.etd ? parseKRDate(data.etd) : null,
eta: data?.eta ? parseUSDate(data.eta) : null,


              month_depart: data?.etd
                ? `${new Date(data.etd).getMonth() + 1}월`
                : "",
              month_arrive: data?.eta
                ? `${new Date(data.eta).getMonth() + 1}월`
                : "",
            }
          : r
      );

      updateRunningTotals(newRows);
      return newRows;
    });
  } catch (error) {
    console.error("INV fetch error", error);
  }
}}
  sx={{
      width: 160,                   // 🔥 넓혀서 잘림 방지
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",     // 🔥 너무 길면 … 처리
      "& .MuiInputBase-input": {
    fontSize: "14px",
    fontWeight:"bold",
    textAlign: "center"   // ⭐ 이 위치가 가장 정확함!
  }
    }}
            />
          </TableCell>

          {/* 🔹 NO → 직접 입력 가능 */}
          <TableCell align="center">
            <TextField
             InputProps={{ readOnly: !editMode }}
              variant="standard"
              value={row.no}
              onChange={(e) => {
                 if (!editMode) return;
                const v = e.target.value;
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, no: v } : r
                  )
                );
              }}
              sx={{ width: 70,
                "& .MuiInputBase-input": {
    fontSize: "14px",
    fontWeight:"bold",
    textAlign: "center"   // ⭐ 이 위치가 가장 정확함!
  }
                
               }}
            />
          </TableCell>

          {/* 🔹 운행여부 (자동만) */}
          <TableCell align="center">
  <Box
    sx={{
      display: "inline-block",
      ...getStatusStyle(row.status),
    }}
  >
    {row.status}
  </Box>
</TableCell>


          {/* 🔹 품목별 수량 입력 */}
{items.map((it) => {
  const field = FIELD_MAP[it.name];
  const value = row[field];

  return (
    <TableCell key={it.name} align="center">
      {editMode ? (
        // =============================
        // ✏️ 편집 모드
        // =============================
        <TextField
          type="number"
          variant="standard"
          value={value || ""}
          onChange={(e) => {
            if (!editMode) return;
            const v = e.target.value;

            setRows((prev) => {
              const newRows = prev.map((r) =>
                r.id === row.id ? { ...r, [field]: v } : r
              );
              updateRunningTotals(newRows);
              return newRows;
            });
          }}
          sx={{
            width: 60,
            "& .MuiInputBase-input": {
              fontSize: "14px",
              textAlign: "center",
            },
          }}
        />
      ) : (
        // =============================
        // 👀 출력 모드 (fmt로 보기 좋게)
        // =============================
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: "bold",
            textAlign: "center",
            color: "#333",
          }}
        >
          {value ? Number(value).toLocaleString("en-US") : ""}
        </Typography>
      )}
    </TableCell>
  );
})}


          {/* 🔹 ETD (입력칸 제거, 자동 표시만) */}
          <TableCell align="center">
  <Typography sx={{ fontWeight: "bold", fontSize: "15px" }}>
    {row.etd ? formatKRDate(row.etd) : ""}


  </Typography>
</TableCell>

          {/* 🔹 ETA (입력칸 제거, 자동 표시만) */}
          <TableCell align="center">
  <Box
    sx={{
      display: "inline-block",
      ...getEtaStyle(row.status),
      fontWeight:"bold",
      fontSize: "15px",
    }}
  >
    {row.eta ? row.eta.toISOString().split("T")[0] : ""}

  </Box>
</TableCell>


          
          {/* 🔹 선적월 & 도착월 */}
<TableCell align="center" sx={{ fontWeight: "bold" }}>
  {row.month_depart}
</TableCell>

<TableCell align="center" sx={{ fontWeight: "bold" }}>
  {row.month_arrive}
</TableCell>

          
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Paper>







    </Box>
  );
}
