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

  /* ===============================
      🔶 상태값
  =============================== */
  const [targetStock, setTargetStock] = useState(30000);

  // 품목 데이터
  const [items] = useState([
    { name: "MQ4 GEAR-DRIVEN", running: 5000, overStock: 61000, unit: 7500 },
    { name: "MQ4 PINION-DRIVE", running: 12000, overStock: 23500, unit: 4000 },
    { name: "NX4 GEAR-DRIVEN", running: 12000, overStock: 38500, unit: 4000 },
    { name: "NX4 PINION-DRIVE", running: 4000, overStock: 51500, unit: 4000 },
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

  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: prev.length + 1,
        inv_no: "",
        no: "",
        status: "",
        item: "",
        cont: "",
        bl: "",
        etd: "",
        eta: "",
        month_depart: "",
        month_arrive: ""
      }
    ]);
  };

  /* ===============================
      🔶 month 자동 계산
  =============================== */
  const updateMonth = (value, field, id) => {
    let updated = { [field]: value };

    if (field === "etd") {
      updated.month_depart = value ? `${new Date(value).getMonth() + 1}월` : "";
    }
    if (field === "eta") {
      updated.month_arrive = value ? `${new Date(value).getMonth() + 1}월` : "";
    }

    setRows(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updated } : r))
    );
  };

  return (
    <Box sx={{ p: 3 }}>

      {/* 제목 */}
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
  원소재 재고 파악 및 운송일정 관리  (한국 날짜: {new Date().toLocaleDateString("ko-KR")})
</Typography>



      {/* 적정재고 기준 */}
      <Paper sx={{ p: 2, mb: 3, borderLeft: "5px solid #ff9800" }}>
        <Typography sx={{ fontWeight: "bold", mb: 1 }}>적정재고 기준</Typography>
        <TextField
          label="적정재고 수량"
          type="number"
          value={targetStock}
          onChange={(e) => setTargetStock(Number(e.target.value))}
          size="small"
          sx={{ width: 200 }}
        />
      </Paper>

      {/* 과부족 상태 패널 (T 제외 → 4개만 출력) */}
      <Paper sx={{ p: 2, mb: 4,border: "2px solid #777" }}>
        <Typography sx={{ fontWeight: "bold", mb: 2 }}>※ 과부족 상태 ※</Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              {["품목","적정재고","운행중","기준재고초과(D6)","도착후재고","판정"].map(h => (
                <TableCell key={h} align="center" sx={{ fontWeight: "bold" }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {items.slice(0, 4).map((it, idx) => {
              const d6 = it.overStock;
              const after = it.running + it.overStock;
              const status = judgeStatus(d6, targetStock);

              return (
                <TableRow key={idx}>
                  <TableCell align="center">{it.name}</TableCell>
                  <TableCell align="center">{targetStock}</TableCell>
                  <TableCell align="center">{it.running}</TableCell>
                  <TableCell align="center">{d6}</TableCell>
                  <TableCell align="center">{after}</TableCell>
                  <TableCell
                    align="center"
                    sx={{
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
        {items.map((it, idx) => (
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
                label="실사자료"
                type="number"
                size="small"
                variant="standard"
                value={it.overStock}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setItems((prev) =>
                    prev.map((p, pIdx) =>
                      pIdx === idx ? { ...p, overStock: v } : p
                    )
                  );
                }}
                sx={{
                  width: 120,
                  "& input": {
                    textAlign: "center",
                    fontSize: 16,
                    color: "#1155cc",
                    fontWeight: "bold",
                  }
                }}
              />
            </Box>

            {/* 단위 */}
            <Box sx={{ fontSize: 12, color: "#444", mt: 1 }}>
              단위 : {it.unit.toLocaleString()}
            </Box>
          </TableCell>
        ))}
      </TableRow>

      {/* 🔹 2단: 선적가감필요횟수 */}
      <TableRow sx={{ borderBottom: "2px dotted #777" }}>
        {items.map((it) => {
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
          fontWeight: "bold"
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
  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, mb: 1 }}>
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
          <TableCell key={h} align="center" sx={{ fontWeight: "bold" }}>
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
              onChange={(e) => {
                const inv = e.target.value;

                // 샘플 자동 매핑
                const auto = {
                  "ENG-MAT-20251013-V1": {
                    no: "31ENG",
                    status: "운행완료",
                    etd: "2025-10-27",
                    eta: "2025-11-26",
                  },
                  "ENG-MAT-20251020-V1": {
                    no: "32ENG",
                    status: "운행완료",
                    etd: "2025-10-27",
                    eta: "2025-11-26",
                  },
                };

                const found = auto[inv];

                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id
                      ? {
                          ...r,
                          inv_no: inv,
                          no: found?.no || "",
                          status: found?.status || "",
                          etd: found?.etd || "",
                          eta: found?.eta || "",
                          month_depart: found?.etd
                            ? `${new Date(found.etd).getMonth() + 1}월`
                            : "",
                          month_arrive: found?.eta
                            ? `${new Date(found.eta).getMonth() + 1}월`
                            : "",
                        }
                      : r
                  )
                );
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
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r) =>
                      r.id === row.id ? { ...r, [it.name]: e.target.value } : r
                    )
                  )
                }
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
