import OilInvoiceTimeline from "./OilInvoiceTimeline";
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";


import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TextField,
  Button,
} from "@mui/material";



export default function OilShipmentSchedule() {
// HEADER 수정 (inv, po, etd, eta)
const updateHeader = async (invKey, field, value) => {
  const dbFieldMap = {
    inv: "inv_no",
    po: "po_no",
    etd: "etd",
    eta: "eta",
  };

  const dbField = dbFieldMap[field];

  setScheduleRows((prev) =>
    prev.map((row) => {
      if (row.inv_no === invKey || row.id === invKey) {

        // 🔥 inv# 입력 시 inv_no 자체도 바꿔주기
        const updatedRow = { ...row, [dbField]: value };
        if (field === "inv") {
          updatedRow.inv_no = value;
        }
        return updatedRow;
      }
      return row;
    })
  );

  // 🔥 INV 입력 시 자동 invoice 정보를 채움
  if (field === "inv") {
    const res = await fetch(`${API_BASE}/api/oil-invoice/${value}`);
    const data = await res.json();

    if (!data.error) {
      setScheduleRows((prev) =>
        prev.map((row) =>
          row.inv_no === value
            ? {
                ...row,
                po_no: data.po_no || "",
                etd: data.etd || "",
                eta: data.eta || "",
              }
            : row
        )
      );
    }
  }
};



// SEQ/QTY 수정
const updateSeq = (invKey, seq, value) => {
  setScheduleRows((prev) =>
    prev.map((row) =>
      row.inv_no === invKey && Number(row.seq) === Number(seq)
        ? { ...row, qty: value }
        : row
    )
  );
};


const API_BASE = import.meta.env.VITE_API_URL;


//DB 로딩 함수
const loadOilSchedule = async () => {
  const res = await fetch(`${API_BASE}/api/oil-schedule`);
  const data = await res.json();
  setScheduleRows(data);
};
  const [editMode, setEditMode] = useState(false);    // ← 반드시 여기에!


  // 전체 스케줄 rows (DB → React)
const [scheduleRows, setScheduleRows] = useState([]);
const [inv, setInv] = useState("");
const [po, setPo] = useState("");
const [etd, setEtd] = useState("");
const [eta, setEta] = useState("");
// 새 행 추가
const addRow = () => {
  const tempId = uuidv4();
  const newRows = [];

  for (let i = 1; i <= 38; i++) {
    newRows.push({
      id: uuidv4(),
      inv_no: tempId,
      po_no: "",
      etd: "",
      eta: "",
      seq: i,
      qty: "",
    });
  }

  setScheduleRows(prev => [...prev, ...newRows]);
};




// 행 수정
const updateRow = async (index, field, value) => {
  const newRows = [...scheduleRows];
  newRows[index][field] = value;

  // 👉 INV# 입력 시 자동 invoice 불러오기
  if (field === "inv_no") {
    const res = await fetch(`${API_BASE}/api/oil-invoice/${value}`);
    const data = await res.json();

    if (!data.error) {
      newRows[index].po_no = data.po_no;
      newRows[index].etd = data.etd;
      newRows[index].eta = data.eta;
    }
  }

  setScheduleRows(newRows);
};


// 전체 저장(BULK)
const saveAll = async () => {
  const res = await fetch(`${API_BASE}/api/oil-schedule/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scheduleRows),
  });

  const data = await res.json();

  if (data.error) {
    alert("저장 실패: " + data.error);
    return;
  }

  alert("저장 완료!");
  loadOilSchedule();
};



  // 1) 초기 로딩 — oil_schedule_row 전체 불러오기
  useEffect(() => {
    loadOilSchedule();
  }, []);
const loadInvoiceInfo = async () => {
  if (!inv) return;

  const res = await fetch(`${API_BASE}/api/oil-invoice/${inv}`);
  const data = await res.json();

  if (!data.error) {
    setPo(data.po_no || "");
    setEtd(data.etd || "");
    setEta(data.eta || "");
  }
};


const grouped = {};

scheduleRows.forEach(r => {
  if (!grouped[r.inv_no]) {
    grouped[r.inv_no] = {
      inv: r.inv_no,
      po: r.po_no,
      etd: r.etd,
      eta: r.eta,
      items: [],
    };
  }

  grouped[r.inv_no].items.push({
    seq: r.seq,
    qty: r.qty,
  });
});


// invoice header grouping
const invoiceHeader = {};

scheduleRows.forEach((r) => {
  const key = r.inv_no || "";

  if (!invoiceHeader[key]) {
    invoiceHeader[key] = {
      inv: r.inv_no || "",
      po: r.po_no || "",
      etd: r.etd || "",
      eta: r.eta || "",
    };
  }
});



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
        {/* === 수정/입력 영역 === */}
<Box 
  sx={{ 
    display: "flex", 
    gap: 2, 
    mb: 3, 
    justifyContent: "flex-end"  // 🔥 우측 정렬
  }}
>
  <Button variant="contained" onClick={addRow}>
    + 행 추가
  </Button>

  <Button
    variant="outlined"
    color="error"
    onClick={() => {
  const groups = Object.keys(grouped);
  if (groups.length === 0) return;

  const lastInv = groups[groups.length - 1]; // 마지막 INV 그룹

  setScheduleRows(prev =>
    prev.filter(r => r.inv_no !== lastInv)  // ⬅️ 그룹 전체 row 삭제
  );
}}

  >
    행 삭제
  </Button>

  <Button
    variant="outlined"
    color={editMode ? "error" : "primary"}
    onClick={() => setEditMode(!editMode)}
  >
    {editMode ? "수정 종료" : "수정 모드"}
  </Button>

  <Button variant="contained" color="success" onClick={saveAll}>
    저장하기
  </Button>
</Box>



      

   {Object.values(grouped).map((inv) => (
  <OilInvoiceTimeline
    key={inv.inv}
    invoiceInfo={{
      inv: inv.inv,
      po: inv.po,
      etd: inv.etd,
      eta: inv.eta,
    }}
    items={inv.items}
    editMode={editMode}
    onUpdateHeader={(field, value) => updateHeader(inv.inv, field, value)}
    onUpdateSeq={(seq, value) => updateSeq(inv.inv, seq, value)}
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
