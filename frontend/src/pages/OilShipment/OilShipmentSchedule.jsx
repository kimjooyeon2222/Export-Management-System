import OilInvoiceTimeline from "./OilInvoiceTimeline";
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";


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
    const API_BASE = import.meta.env.VITE_API_URL;
const [showOilList, setShowOilList] = useState(false);

      const [oilList, setOilList] = useState([]);
const [oilEditMode, setOilEditMode] = useState(false);
const maxNo = oilList.length > 0 ? Math.max(...oilList.map(o => o.no)) : 0;

const navigate = useNavigate();
const addOilRow = () => {
    const newRow = {
    no: maxNo + 1,
    code: "",
    name: "",
    spec: ""
  };
  setOilList(prev => [...prev, newRow]);
};

const deleteOilRow = () => {
  setOilList(prev => prev.slice(0, -1));
};

const updateOilCell = (no, field, value) => {
  setOilList(prev =>
    prev.map(row =>
      row.no === no
        ? { ...row, [field]: value }
        : row
    )
  );
};
const saveOilList = async () => {
  await fetch(`${API_BASE}/api/oil-items/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(oilList),
  });
  alert("오일 관리 리스트 저장 완료!");
};

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




//DB 로딩 함수
const loadOilSchedule = async () => {
  const res = await fetch(`${API_BASE}/api/oil-schedule`);
  const data = await res.json();
  setScheduleRows(data);
};
  const [editMode, setEditMode] = useState(false);    // ← 반드시 여기에!


  // 전체 스케줄 rows (DB → React)
const [scheduleRows, setScheduleRows] = useState([]);
// ==============================================
// 🔥 오일 관리 리스트(oilList) 변화 → seq 자동 확장
// ==============================================
useEffect(() => {
  if (scheduleRows.length === 0) return; // 아직 초기 로딩 안 된 경우

  const neededSeq = oilList.length; // 예: 42개면 seq 1~42 필요
  if (neededSeq === 0) return;

  const maxSeqInDB = Math.max(...scheduleRows.map(r => r.seq || 0));

  // 🔥 현재 seq가 부족하면 새 seq 자동으로 추가
  if (neededSeq > maxSeqInDB) {
    const missingSeqs = [];
    for (let s = maxSeqInDB + 1; s <= neededSeq; s++) {
      missingSeqs.push(s);
    }

    const invList = [...new Set(scheduleRows.map(r => r.inv_no))];

    const newRows = [];

    invList.forEach(inv => {
      missingSeqs.forEach(s => {
        newRows.push({
          id: uuidv4(),
          inv_no: inv,
          po_no: "",
          etd: "",
          eta: "",
          seq: s,
          qty: "",
        });
      });
    });

    setScheduleRows(prev => [...prev, ...newRows]);
  }
}, [oilList]);

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


useEffect(() => {
  fetch(`${API_BASE}/api/oil-items`)
    .then(res => res.json())
    .then(data => setOilList(data));
}, []);

  

  // ============================
  // 3) 1~38 달력 숫자 자동 생성
  // ============================
  const calendarDays = Array.from({ length: oilList.length }, (_, i) => i + 1);


  return (
    <Box p={3}>
      {/* 제목 */}
      <Typography variant="h5" fontWeight="bold" fontSize="18px" mb={3}>
        오일 운송일정 관리 (Oil Shipment Schedule)
      </Typography>
  <Button
      variant="outlined"
      onClick={() => navigate("/")}
      sx={{
        fontSize:"16x",
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
   
      <Box sx={{ mt: 3 }}>
        {/* === 수정/입력 영역 === */}
{!editMode && (
  <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
    <Button variant="outlined" onClick={() => setEditMode(true)}>
      수정 모드
    </Button>
  </Box>
)}
{editMode && (
  <Box 
    sx={{ 
      display: "flex", 
      gap: 2, 
      mb: 3, 
      justifyContent: "flex-end"
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
        const lastInv = groups[groups.length - 1];
        setScheduleRows(prev => prev.filter(r => r.inv_no !== lastInv));
      }}
    >
      행 삭제
    </Button>

    <Button
      variant="outlined"
      color="error"
      onClick={() => setEditMode(false)}
    >
      수정 종료
    </Button>

    <Button variant="contained" color="success" onClick={saveAll}>
      저장하기
    </Button>
  </Box>
)}


  <Paper sx={{ p: 2 , mb:3}}>
<Table 
  size="small"
  sx={{
    "& td, & th": { 
      fontSize: "18px",
      padding: "10px 6px"   // ← 세로 여백 늘림
    },
    "& tr": {
      height: "40px"        // ← 행 높이 증가
    }
  }}
>

  <TableHead>
    <TableRow sx={{ backgroundColor: "#e8f5e9" }}>
      <TableCell align="center">INV#</TableCell>
      <TableCell align="center">PO#</TableCell>
      <TableCell align="center">ETD</TableCell>
      <TableCell align="center">ETA</TableCell>

      {calendarDays.map((day) => (
  <TableCell key={day} align="center">{day}</TableCell>
))}

    </TableRow>
  </TableHead>

  <TableBody>
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
        calendarDays={calendarDays}  // ← ★ 추가

        editMode={editMode}
        onUpdateHeader={(field, value) => updateHeader(inv.inv, field, value)}
        onUpdateSeq={(invKey,seq, value) => updateSeq(invKey, seq, value)}
      />
    ))}
  </TableBody>
</Table>
</Paper>
      

   


      </Box>
      {/* ================================ */}
      {/* 오일 관리 리스트 (1~42) */}
      {/* ================================ */}
      {/* 오일 관리 리스트 Toggle 버튼 */}
<Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
  <Button
    variant="outlined"
    onClick={() => setShowOilList(!showOilList)}
    sx={{ fontWeight: "bold" }}
  >
    {showOilList ? "- 접기" : "+ 오일 관리 리스트 보기"}
  </Button>
</Box>
{showOilList && (
  <Paper sx={{ p: 2 }}>
    <Typography variant="subtitle1" fontWeight="bold" mb={2} fontSize="18px">
      📘 오일 관리 리스트
    </Typography>

    {/* 버튼 그룹 */}
    {!oilEditMode && (
  <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
    <Button variant="outlined" onClick={() => setOilEditMode(true)}>
      수정 모드
    </Button>
  </Box>
)}
{oilEditMode && (
  <Box 
    sx={{ 
      display: "flex",
      gap: 1,
      justifyContent: "flex-end",
      mb: 2
    }}
  >
    <Button variant="contained" onClick={addOilRow}>+ 행 추가</Button>
    <Button variant="outlined" color="error" onClick={deleteOilRow}>행 삭제</Button>

    <Button variant="outlined" color="error" onClick={() => setOilEditMode(false)}>
      수정 종료
    </Button>

    <Button variant="contained" color="success" onClick={saveOilList}>
      저장하기
    </Button>
  </Box>
)}


    <Table
      size="small"
      sx={{
        "& td, & th": { fontSize: "18px" }
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: "8%", fontWeight: "bold" }}>순번</TableCell>
          <TableCell sx={{ width: "15%", fontWeight: "bold" }}>품번</TableCell>
          <TableCell sx={{ width: "25%", fontWeight: "bold" }}>품명</TableCell>
          <TableCell sx={{ width: "52%", fontWeight: "bold" }}>규격</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {oilList.map((oil) => (
          <TableRow key={oil.no}>
            <TableCell>{oil.no}</TableCell>

            <TableCell>
              {oilEditMode ? (
                <TextField
                  size="small"
                  value={oil.code}
                  onChange={(e) => updateOilCell(oil.no, "code", e.target.value)}
                />
              ) : (
                oil.code
              )}
            </TableCell>

            <TableCell>
              {oilEditMode ? (
                <TextField
                  size="small"
                  value={oil.name}
                  onChange={(e) => updateOilCell(oil.no, "name", e.target.value)}
                />
              ) : (
                oil.name
              )}
            </TableCell>

            <TableCell>
              {oilEditMode ? (
                <TextField
                  size="small"
                  value={oil.spec}
                  onChange={(e) => updateOilCell(oil.no, "spec", e.target.value)}
                />
              ) : (
                oil.spec
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Paper>
)}

    </Box>
  );
}
