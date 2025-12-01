// 📌 File: OilShipmentSchedule.jsx

import React from "react";
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper } from "@mui/material";

export default function OilShipmentSchedule() {
  const scheduleHeader = [
    { id: 1, etd: "2025-10-27", eta: "2025-11-26", item: "ATT-OIL-20251022-V1", po: "4500001334" },
    { id: 2, etd: "2025-11-05", eta: "2025-11-30", item: "ATT-OIL-20251027-V1", po: "4500001362" },
    { id: 3, etd: "2025-11-24", eta: "2026-01-04", item: "ATT-OIL-20251118-V1", po: "4500001414" }
  ];

  const oilList = [
    { no: 1, code: "A10U14166", name: "소화방지제", spec: "ANTI SOLDER-10" },
    { no: 2, code: "A10U14168", name: "절삭수", spec: "BW COOL E-300X" },
    { no: 3, code: "A10U14169", name: "윤활유", spec: "DTE-25 ULTRA" },
    { no: 4, code: "A10U14702", name: "절삭유(먼지,연기억제)", spec: "EX-960" },
    { no: 5, code: "A10U10715", name: "자동유(냉화성유)", spec: "FE-56" },
    { no: 6, code: "A10U14165", name: "프레스 오일", spec: "PL-480" },
  ];

  return (
    <Box p={3}>
      {/* 제목 */}
      <Typography variant="h5" fontWeight="bold" mb={2}>
        오일 운송일정 관리 (Oil Shipment Schedule)
      </Typography>

      {/* 상단 일정 요약 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          📦 운송 일정표
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>번호</TableCell>
              <TableCell>품번</TableCell>
              <TableCell>PO#</TableCell>
              <TableCell>ETD</TableCell>
              <TableCell>ETA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scheduleHeader.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.item}</TableCell>
                <TableCell>{row.po}</TableCell>
                <TableCell>{row.etd}</TableCell>
                <TableCell>{row.eta}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* 오일 관리 리스트 */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          📘 오일 관리 리스트
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>순번</TableCell>
              <TableCell>품번</TableCell>
              <TableCell>품목명</TableCell>
              <TableCell>규격</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {oilList.map((oil) => (
              <TableRow key={oil.no}>
                <TableCell>{oil.no}</TableCell>
                <TableCell>{oil.code}</TableCell>
                <TableCell>{oil.name}</TableCell>
                <TableCell>{oil.spec}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
