import React from "react";
import OilInvoiceTimeline from "./OilInvoiceTimeline";

import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";

export default function OilShipmentSchedule() {
    const timelineData = {
  "ATT-OIL-20251022-V1": [
    { seq: 2, qty: "1벌" },
    { seq: 4, qty: "5벌" },
    { seq: 26, qty: "1PL" }
  ],
  "ATT-OIL-20251027-V1": [
    { seq: 9, qty: "2 DR" },
    { seq: 12, qty: "1 DR" }
  ],
  "ATT-OIL-20251118-V1": [
    { seq: 17, qty: "8 DR" },
    { seq: 33, qty: "1 DR" }
  ]
};

  // ============================
  // 1) 운송 일정 Header 데이터
  // ============================
  const shipmentList = [
    {
      id: 1,
      item: "ATT-OIL-20251022-V1",
      po: "4500001334",
      etd: "2025-10-27",
      eta: "2025-11-26",
    },
    {
      id: 2,
      item: "ATT-OIL-20251027-V1",
      po: "4500001362",
      etd: "2025-11-05",
      eta: "2025-11-30",
    },
    {
      id: 3,
      item: "ATT-OIL-20251118-V1",
      po: "4500001414",
      etd: "2025-11-24",
      eta: "2026-01-04",
    },
  ];

  // ============================
  // 2) 오일 관리 리스트 (1~42)
  // ============================
  const oilList = [
    { no: 1, code: "A10U14166", name: "소화방지제", spec: "ANTI SOLDER-10" },
    { no: 2, code: "A10U14168", name: "절삭수", spec: "BW COOL E-300X" },
    { no: 3, code: "A10U14169", name: "윤활유", spec: "DTE-25 ULTRA" },
    { no: 4, code: "A10U14702", name: "절삭유(먼지,연기억제)", spec: "EX-960" },
    { no: 5, code: "A10U10715", name: "자동유(냉화성유)", spec: "FE-56" },
    { no: 6, code: "A10U14165", name: "프레스 오일", spec: "PL-480" },
    { no: 7, code: "A10U14170", name: "백탁저감제", spec: "TECLY NY-C" },
    { no: 8, code: "A10U14167", name: "이형제", spec: "WDR-202A" },
    { no: 9, code: "A10U14103", name: "ALDIES TR", spec: "400ML" },
    { no: 10, code: "A10U14070", name: "CPC 작동유", spec: "AW 46" },
    { no: 11, code: "A10U10710", name: "소포제", spec: "BW-WY-885-220" },
    { no: 12, code: "A10U10617", name: "마유제", spec: "BY LUBE 08(고점자)" },
    { no: 13, code: "A10U10757", name: "엘지유", spec: "BY PL 08G(고점자)" },
    { no: 14, code: "A10U10954", name: "열매체유", spec: "Heat Transfer 52" },
    // === 이어서 42번까지 추가 ===
    { no: 15, code: "A10U10716", name: "CPC 작동유", spec: "WG 56" },
    { no: 16, code: "A10U9887", name: "스케일 방지제", spec: "CLEANER S-100" },
    { no: 17, code: "A10U10071", name: "기어오일", spec: "HA HTC-5 750W-85" },
    { no: 18, code: "A10U10792", name: "초유화 세정액", spec: "WSOL 1820" },
    { no: 19, code: "A10U10181", name: "방청유", spec: "S#22" },
    { no: 20, code: "A10U10065", name: "수용성 세정유", spec: "BW CLEAN W-710" },
    { no: 21, code: "A10U8446", name: "윤활제", spec: "ISO VG5" },
    { no: 22, code: "A10U8447", name: "Hydraulics 기어", spec: "ISO VG46" },
    { no: 23, code: "A10U15003", name: "소화방지제", spec: "ANTI SOLDER-100" },
    { no: 24, code: "A10U8587", name: "백탁저감제(고점자)", spec: "TECTYL NY-C" },
    { no: 25, code: "A10U10791", name: "세척액", spec: "W710" },
    { no: 26, code: "A10U3074", name: "소포제", spec: "BW ADD-AF32" },
    { no: 27, code: "A10U8583", name: "습동유", spec: "Tonna S2 M220" },
    { no: 28, code: "A10U8585", name: "부동액", spec: "ANTIFREEZE EXTRA" },
    { no: 29, code: "A10U15224", name: "ISO VG36 Hydraulic", spec: "AW36 (DRUM/200L)" },
    { no: 30, code: "A10U15654", name: "HYDRAULIC OIL", spec: "VG32" },
    { no: 31, code: "A10U10064", name: "비소용성 연삭제", spec: "SEMI-HOT BW-2000S" },
    { no: 32, code: "A10U10066", name: "수용성세정유", spec: "BW CLEAN W-720SK" },
    { no: 33, code: "A10U8856", name: "그리스", spec: "MOBILUX EP 023" },
    { no: 34, code: "A10U7016", name: "유압유", spec: "AW-32" },
    { no: 35, code: "A10U872", name: "윤활유", spec: "LUBE68" },
    { no: 36, code: "A10U11038", name: "기계유", spec: "Veloctile Oil NO.6" },
    { no: 37, code: "A10U4011", name: "수용성절삭유", spec: "EX-440Z" },
    { no: 38, code: "A10U16452", name: "오일필터(10H필터)", spec: "E-HC-61X-F-OJ" },
    { no: 39, code: "", name: "", spec: "" },
    { no: 40, code: "", name: "", spec: "" },
    { no: 41, code: "", name: "", spec: "" },
    { no: 42, code: "", name: "", spec: "" },
  ];

  // ============================
  // 3) 1~38 달력 숫자 자동 생성
  // ============================
  const calendarDays = Array.from({ length: 38 }, (_, i) => i + 1);

  return (
    <Box p={3}>
      {/* 제목 */}
      <Typography variant="h5" fontWeight="bold" mb={3}>
        오일 운송일정 관리 (Oil Shipment Schedule)
      </Typography>

   
      <Box sx={{ mt: 3 }}>
        {shipmentList.map((row) => (
          <OilInvoiceTimeline
  key={row.id}
  invoiceInfo={{
    inv: row.item,
    po: row.po,
    etd: row.etd,
    eta: row.eta
  }}
  items={timelineData[row.item] || []}
/>

        ))}
      </Box>
      {/* ================================ */}
      {/* 오일 관리 리스트 (1~42) */}
      {/* ================================ */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={2}>
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
