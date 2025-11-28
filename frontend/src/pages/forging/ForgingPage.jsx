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

  const [targetStock, setTargetStock] = useState(30000);
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

  return (
    <Box sx={{ p: 3 }}>

      {/* ================================
          🔶 타이틀
      ================================= */}
      <Typography
        variant="h5"
        sx={{ fontWeight: "bold", mb: 3, color: "#333" }}
      >
        원소재 재고 파악 및 운송일정 관리 (단조품)
      </Typography>

      {/* ================================
          🔶 적정재고 기준 설정
      ================================= */}
      <Paper sx={{ p: 2, mb: 3, borderLeft: "5px solid #ff9800" }}>
        <Typography sx={{ fontWeight: "bold", mb: 1 }}>
          적정재고 기준
        </Typography>

        <TextField
          label="적정재고 수량"
          type="number"
          size="small"
          value={targetStock}
          onChange={(e) => setTargetStock(e.target.value)}
          sx={{ width: 200 }}
        />
      </Paper>

      {/* ================================
          🔶 품목별 현황 테이블
      ================================= */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography sx={{ fontWeight: "bold", mb: 2 }}>
          품목별 재고 현황
        </Typography>

        <Table size="small">
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              {["품목", "운행중", "기준재고초과", "도착후재고", "가감필요횟수"].map((h) => (
                <TableCell key={h} align="center" sx={{ fontWeight: "bold" }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {[
              "MQ4 GEAR-DRIVEN",
              "MQ4 PINION-DRIVE",
              "NX4 GEAR-DRIVEN",
              "NX4 PINION-DRIVE"
            ].map((item, i) => (
              <TableRow key={i}>
                <TableCell align="center">{item}</TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", color: "#d32f2f" }}>
                  -
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* ================================
          🔶 단조품 스케줄 관리
      ================================= */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography sx={{ fontWeight: "bold" }}>단조품 운송 스케줄</Typography>

          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={handleAddRow}
          >
            + 행추가
          </Button>
        </Box>

        <Table size="small">
          <TableHead sx={{ bgcolor: "#ffe599" }}>
            <TableRow>
              {[
                "INV#",
                "NO",
                "운행여부",
                "품목",
                "컨테이너",
                "BL#",
                "ETD",
                "ETA",
                "선적월",
                "도착월"
              ].map((h) => (
                <TableCell
                  key={h}
                  align="center"
                  sx={{ fontWeight: "bold", color: "#333" }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {[
                  "inv_no",
                  "no",
                  "status",
                  "item",
                  "cont",
                  "bl",
                  "etd",
                  "eta",
                  "month_depart",
                  "month_arrive"
                ].map((field) => (
                  <TableCell key={field} align="center">
                    <TextField
                      variant="standard"
                      value={row[field]}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, [field]: e.target.value } : r
                          )
                        )
                      }
                      sx={{ width: "100px" }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
