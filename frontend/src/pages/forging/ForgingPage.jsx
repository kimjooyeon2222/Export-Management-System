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

export default function ForgingPage() {
const API_BASE = import.meta.env.VITE_API_URL;

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
      const total = rows.reduce((sum, r) => {
        // 🚀 STATUS가 '운항중'인 행만 합산
        if (r.status === "운항중") {
          const val = Number(r[item.name] || 0);
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
  

  return (
    
    <Box sx={{ p: 3 }}>
{/* 작성자 + 북미 날짜 */}
<Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 1 }}>
  <TextField
    label="작성자"
    size="small"
    value={writer}
    onChange={(e) => setWriter(e.target.value)}
    sx={{ width: 150 }}
  />
  <TextField
    label="북미 기준 날짜 (YYYY-MM-DD)"
    size="small"
    placeholder="2025-11-03"
    value={usDate}
    onChange={(e) => setUsDate(e.target.value)}
    sx={{ width: 180 }}
  />
</Box>
      {/* 제목 */}
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
  원소재 재고 파악 및 운송일정 관리 
  ({usDate ? getPeriod(usDate) : "작성일자"})

</Typography>




      {/* 적정재고 기준 */}
      <Paper sx={{ p: 2, mb: 3, borderLeft: "5px solid #ff9800" }}>
        <Typography sx={{ fontWeight: "bold", mb: 1, fontSize:"18px" }}>적정재고 기준</Typography>
        <TextField
          label="적정재고 수량"
          type="number"
          value={targetStock}
          onChange={(e) => setTargetStock(Number(e.target.value))}
          size="small"
          sx={{ width: 200,
            "& .MuiInputBase-input": {
      fontSize: "19x",   // ⭐ 입력 글씨 크기
      fontWeight: "bold"
    },
            "& .MuiInputLabel-root": {
      fontSize: "17px",     // ← ⭐ 라벨 글씨 크기
      fontWeight: "bold"
    } }}
        />
      </Paper>

      {/* 과부족 상태 패널 (T 제외 → 4개만 출력) */}
      <Paper sx={{ p: 2, mb: 4,border: "2px solid #777" }}>
        <Typography sx={{ fontWeight: "bold", mb: 2, fontSize:"16px" }}>※ 과부족 상태 ※</Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              {["품목","적정재고","운항중","기존재고-불량","운항중+정상재고","판정"].map(h => (
                <TableCell key={h} align="center" sx={{ fontWeight: "bold", fontSize:14 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {items.slice(0, 4).map((it, idx) => {
            const normal = it.normalStock;          // 기존재고 - 불량 자동 반영됨
const after = it.running + normal;      // 운항중 + 정상재고
const status = judgeStatus(normal, targetStock);


              return (
                <TableRow key={idx}>
                  <TableCell align="center">{it.fullName}</TableCell>
                  <TableCell align="center">{targetStock}</TableCell>
                  <TableCell align="center">{it.running}</TableCell>
                  <TableCell align="center">{normal}</TableCell>
                  <TableCell align="center">{after}</TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontSize:16,
                      fontWeight: "bold",
                      color:
                        status === "초과" ? "purple" :
                        status === "양호" ? "green" :
                        status === "위험" ? "red" :
                        "orange"
                    }}
                  >
                    {status}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* ===============================
    🔶 과부족 아래 전체 (요구사항 반영 완성본)
=============================== */}
<Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>

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
      🔶 1단: 품목명 + 실사자료 + 단위  
  =============================== */}
  <Table size="small" sx={{ borderCollapse: "collapse" }}>
    <TableHead>
      <TableRow sx={{ bgcolor: "#d9ead3", borderBottom: "2px solid #000" }}>
        {items.slice(0, 4).map((it, idx) => (
          <TableCell
            key={it.name}
            align="center"
            sx={{
              fontWeight: "bold",
              borderRight: "1px solid #999",
              py: 2
            }}
          >
            {/* 품목명 */}
            <Box sx={{ fontWeight: "bold", fontSize: 14 }}>{it.name}</Box>
            
            {/* 실사자료 입력 */}
            <Box sx={{ mt: 1 }}>
              <TextField
                label={getKoreanMonthLabel(usDate)}

                type="number"
                size="small"
                variant="standard"
                value={it.overStock}
                onChange={(e) => {
  const v = Number(e.target.value);

  setItems((prev) => {
    const newItems = prev.map((p, pIdx) =>
      pIdx === idx ? { ...p, overStock: v } : p
    );
    return newItems;
  });

  updateNormalStock();   // ⭐ 정상재고 즉시 업데이트
}}

                sx={{
                  // ⬇⬇ 라벨 글씨 키우기
    "& .MuiInputLabel-root": {
      fontSize: "18px",  
      fontWeight: "bold",
    },
                  width: 120,
                  "& input": {
                    textAlign: "center",
                    fontSize: 18,
                    color: "#1155cc",
                    fontWeight: "bold",
                  }
                }}
              />
            </Box>

            {/* 🔥 불량 및 발청소재 입력칸 추가 */}
  <Box sx={{ mt: 1 }}>
    <TextField
      label="불량/발청소재"
      size="small"
      variant="standard"
      onChange={(e) => {
  const v = Number(e.target.value);

  setItems((prev) => {
    const newItems = prev.map((p, pIdx) =>
      pIdx === idx ? { ...p, defect: v } : p
    );
    return newItems;
  });

  updateNormalStock();   // ⭐ 정상재고 즉시 반영
}}

      sx={{
        width: 140,
        "& input": {
          textAlign: "center",
          fontSize: 15,
        },
        "& .MuiInputLabel-root": {
          fontSize: 13,
        },
      }}
    />
  </Box>
          </TableCell>
        ))}
      </TableRow>

      {/* 🔹 2단: 선적가감필요횟수 */}
      <TableRow sx={{ borderBottom: "2px dotted #777" }}>
        {items.slice(0, 4).map((it) => {
  const adjust = window.calcAdjustExcel(it.overStock, targetStock, it.unit);

  return (
    <TableCell
      key={it.name + "_adj"}
      align="center"
      sx={{
        fontWeight: "bold",
        borderRight: "1px solid #ccc",
        py: 1
      }}
    >
      <Box
        component="span"
        sx={{
          color:
            adjust > 0 ? "#1155cc" :   // 양수 → 파란색
            adjust < 0 ? "#d32f2f" :   // 음수 → 빨간색
            "#000",                    // 0 → 검정
          fontWeight: "bold",
          fontSize: "16px"   // ⭐ 글자 크기 키움
        }}
      >
        선적가감필요횟수: {adjust}
      </Box>
    </TableCell>
  );
})}


      </TableRow>
    </TableHead>
  </Table>

  {/* ===============================  
      🔶 행추가 버튼  
  =============================== */}
  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, mb: 1, gap:1 }}>
    <Button
      variant="contained"
      color="success"
      size="small"
      onClick={() =>
        setRows((prev) => [
          ...prev,
          {
            id: prev.length + 1,
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
          "운행여부",
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
              variant="standard"
              value={row.inv_no || ""}
              onChange={async (e) => {
  const inv = e.target.value;

  // 🔥 1) DB에서 INV 검색
  const res = await fetch(`${API_BASE}/api/invoice/${inv}`);
  const data = await res.json();

  // 🔥 2) 운행여부 계산
  let status = "";
  const today = new Date();  
  const etd = data?.etd ? new Date(data.etd) : null;
  const eta = data?.eta ? new Date(data.eta) : null;

  if (!data?.eta || data.eta === "일정 없음") status = "부산항 미입고";
  else if (eta < today) status = "입고완료";
  else if (etd > today) status = "선적대기중";
  else status = "운항중";

  // 🔥 3) rows 갱신
  setRows((prev) =>
    prev.map((r) =>
      r.id === row.id
        ? {
            ...r,
            inv_no: inv,
            no: data?.no || "",
            status,
            etd: data?.etd || "",
            eta: data?.eta || "",
            month_depart: data?.etd
              ? `${new Date(data.etd).getMonth() + 1}월`
              : "",
            month_arrive: data?.eta
              ? `${new Date(data.eta).getMonth() + 1}월`
              : "",
          }
        : r
    )
  );
    updateRunningTotals(newRows); // ⭐⭐⭐⭐ 중요! 이걸 추가해야 running 값이 제대로 나옴
    return newRows;

}}

              sx={{ width: 150 }}
            />
          </TableCell>

          {/* 🔹 NO → 직접 입력 가능 */}
          <TableCell align="center">
            <TextField
              variant="standard"
              value={row.no}
              onChange={(e) => {
                const v = e.target.value;
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, no: v } : r
                  )
                );
              }}
              sx={{ width: 120 }}
            />
          </TableCell>

          {/* 🔹 운행여부 (자동만) */}
          <TableCell align="center">{row.status}</TableCell>

          {/* 🔹 품목별 수량 입력 */}
          {items.map((it) => (
            <TableCell key={it.name} align="center">
              <TextField
                type="number"
                variant="standard"
                value={row[it.name] || ""}
                onChange={(e) => {
  const value = e.target.value;

  setRows((prev) => {
    const newRows = prev.map((r) =>
      r.id === row.id ? { ...r, [it.name]: value } : r
    );

    updateRunningTotals(newRows);  // ⭐ 자동 반영
    return newRows;
  });
}}

                sx={{ width: 90 }}
              />
            </TableCell>
          ))}

          {/* 🔹 ETD (입력칸 제거, 자동 표시만) */}
          <TableCell align="center">{row.etd}</TableCell>

          {/* 🔹 ETA (입력칸 제거, 자동 표시만) */}
          <TableCell align="center">{row.eta}</TableCell>

          {/* 🔹 선적월 & 도착월 */}
          <TableCell align="center">{row.month_depart}</TableCell>
          <TableCell align="center">{row.month_arrive}</TableCell>
          
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Paper>







    </Box>
  );
}
