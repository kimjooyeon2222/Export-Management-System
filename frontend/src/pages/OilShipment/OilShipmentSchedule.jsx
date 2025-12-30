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

import { apiFetch } from "api/apiFetch";


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
    await apiFetch(`${API_BASE}/api/oil-items/bulk`, {
      method: "POST",
      body: JSON.stringify(oilList),
    });
    alert("오일 관리 리스트 저장 완료!");
  };

  // HEADER 수정 (inv, po, etd, eta)
  const updateHeader = async (invKey, field, value) => {
    try {
      const dbFieldMap = {
        inv: "inv_no",
        po: "po_no",
        etd: "etd",
        eta: "eta",
      };

      const dbField = dbFieldMap[field];
      let processedValue = value;

      if (field === "po") {
        processedValue = value
          .split("\n")
          .map(v => v.trim())
          .filter(Boolean)
          .join(",");
      }

      // 1️⃣ INV 즉시 반영
      setScheduleRows(prev =>
        prev.map(row =>
          row._groupKey === invKey
            ? {
              ...row,
              [dbField]: processedValue,
              ...(field === "inv" ? { inv_no: processedValue } : {}),
            }
            : row
        )
      );


      if (field !== "inv") return;

      const newInv = processedValue;

      // 2️⃣ invoice header load
      const res = await apiFetch(`${API_BASE}/api/oil-invoice/${newInv}`);
      const data = await res.json();

      // 2️⃣ invoice header load (groupKey 기준으로 수정)
      if (!data.error) {
        setScheduleRows(prev =>
          prev.map(row =>
            row._groupKey === invKey
              ? {
                ...row,
                po_no: Array.isArray(data.po_no)
                  ? data.po_no.join(",")
                  : data.po_no || "",
                etd: data.etd || "",
                eta: data.eta || "",
              }
              : row
          )
        );
      }


      // 3️⃣ qty auto-load (🔥 invKey 완전 제거)
      // 3️⃣ qty auto-load (QTY 전용, header와 분리)
      // 3️⃣ qty auto-load (QTY 전용, header와 분리)
      const qtyRes = await apiFetch(
        `${API_BASE}/api/oil/auto-load?inv_no=${newInv}` // ✅ query param
      );
      const qtyData = await qtyRes.json();

      setScheduleRows(prev =>
        prev.map(row => {
          if (row._groupKey !== invKey) return row;

          const q = qtyData.find(
            d => Number(d.seq) === Number(row.seq)
          );

          return {
            ...row,
            inv_no: newInv,
            qty: q ? q.qty : row.qty,
          };
        })
      );

    } catch (e) {

      console.error("updateHeader 실패:", e);
    }



  };





  // SEQ/QTY 수정
  const updateSeq = (groupKey, seq, value) => {
    setScheduleRows(prev =>
      prev.map(row =>
        row._groupKey === groupKey &&
          Number(row.seq) === Number(seq)
          ? { ...row, qty: value }
          : row
      )
    );
  };






  //DB 로딩 함수
  const loadOilSchedule = async () => {
    const res = await apiFetch(`${API_BASE}/api/oil-schedule`);
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error("❌ oil-schedule 응답이 배열 아님:", data);
      setScheduleRows([]);   // 💡 무조건 배열로 보정
      return;
    }

    setScheduleRows(data);
  };
  const [editMode, setEditMode] = useState(false);    // ← 반드시 여기에!


  // 전체 스케줄 rows (DB → React)
  const [scheduleRows, setScheduleRows] = useState([]);
  // ==============================================
  // 🔥 오일 관리 리스트(oilList) 변화 → seq 자동 확장
  // ==============================================
  useEffect(() => {
    if (oilList.length === 0) return;

    setScheduleRows(prev => {
      if (prev.length === 0) return prev;

      const invList = [...new Set(prev.map(r => r.inv_no))];
      const newRows = [];

      invList.forEach(inv => {
        oilList.forEach(oil => {
          const exists = prev.some(
            r =>
              r.inv_no === inv &&
              Number(r.seq) === Number(oil.no)
          );

          if (!exists) {
            newRows.push({
              id: uuidv4(),
              inv_no: inv,
              po_no: "",
              etd: "",
              eta: "",
              seq: oil.no,   // ✅ oil_item_list.no 기준
              qty: "",
            });
          }
        });
      });

      return newRows.length > 0
        ? [...prev, ...newRows]
        : prev;
    });
  }, [oilList]);



  const [inv, setInv] = useState("");
  const [po, setPo] = useState("");
  const [etd, setEtd] = useState("");
  const [eta, setEta] = useState("");
  // 새 행 추가
  const addRow = () => {
    const groupKey = uuidv4();
    const newRows = [];

    oilList.forEach(oil => {
      newRows.push({
        id: uuidv4(),
        _groupKey: groupKey,   // ⭐ 핵심
        inv_no: groupKey,      // 초기에는 같게
        seq: oil.no,
        qty: "",
      });
    });

    setScheduleRows(prev => [...prev, ...newRows]);
  };






  // 전체 저장(BULK)
  // 전체 저장(BULK)
  const saveAll = async () => {
    // 🔥 저장 전 PO 필드 정리 (가장 중요!)
    const cleanedRows = scheduleRows.map(row => {
      let po = row.po_no || "";

      // 1) 배열이면 join
      if (Array.isArray(po)) {
        po = po.join(",");
      }

      // 2) 개행 있으면 콤마로 변환
      po = po.replace(/\n/g, ",");

      // 3) 콤마 기준 트림 + 중복 제거
      po = po
        .split(",")
        .map(v => v.trim())
        .filter(v => v !== "")
        .join(",");

      return {
        ...row,
        po_no: po
      };
    });

    // 🔥 cleanedRows만 DB에 저장
    const res = await apiFetch(`${API_BASE}/api/oil-schedule/bulk`, {
      method: "POST",
      body: JSON.stringify(cleanedRows),
    });

    const data = await res.json();

    if (data.error) {
      alert("저장 실패: " + data.error);
      return;
    }

    alert("저장 완료!");
    loadOilSchedule();
    setEditMode(false);
  };



  // 1) 초기 로딩 — oil_schedule_row 전체 불러오기
  useEffect(() => {
    loadOilSchedule();
  }, []);
  const loadInvoiceInfo = async () => {
    if (!inv) return;

    const res = await apiFetch(`${API_BASE}/api/oil-invoice/${inv}`);
    const data = await res.json();

    if (!data.error) {
      setPo(data.po_no || "");
      setEtd(data.etd || "");
      setEta(data.eta || "");
    }
  };


  const grouped = {};

  scheduleRows.forEach(r => {
    const key = r._groupKey || r.inv_no;

    if (!grouped[key]) {
      grouped[key] = {
        groupKey: key,
        inv: r.inv_no,
        po: r.po_no,
        etd: r.etd,
        eta: r.eta,
        items: [],
      };
    }

    grouped[key].items.push({
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
    apiFetch(`${API_BASE}/api/oil-items`)
      .then(res => res.json())
      .then(data => setOilList(data));
  }, []);



  // ============================
  // 3) 1~38 달력 숫자 자동 생성
  // ============================
  const calendarDays = Array.from({ length: oilList.length }, (_, i) => i + 1);


  return (
    <Box p={3}>
      <Button
        variant="outlined"
        onClick={() => navigate("/")}
        sx={{
          mt: 1,
          mb: 5,
          fontSize: "15px",
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
        {/* 제목 */}
        <Typography variant="h5" fontWeight="bold" fontSize="20px">
          오일 운송일정 관리 (Oil Shipment Schedule)
        </Typography>
        {/* 오일 관리 리스트 (1~42) */}
        {/* ================================ */}
        {/* 오일 관리 리스트 Toggle 버튼 */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowOilList(!showOilList)}
            sx={{ fontWeight: "bold" }}
          >
            {showOilList ? "- 접기" : "+ 오일 관리 리스트 보기"}
          </Button>
        </Box>
        {showOilList && (
          <Paper sx={{ p: 2, mb: 7 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={2} fontSize="18px">
              📘 오일 관리 리스트
            </Typography>

            {/* 버튼 그룹 */}
            {!oilEditMode && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Button variant="outlined" onClick={() => setOilEditMode(true)}>
                  수정 모드 활성화
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
        {/* === 수정/입력 영역 === */}
        {!editMode && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button variant="outlined" onClick={() => setEditMode(true)}>
              수정 모드 활성화
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
                const lastGroupKey = Object.keys(grouped).slice(-1)[0];

                setScheduleRows(prev =>
                  prev.filter(r => r._groupKey !== lastGroupKey)
                );

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


        <Paper sx={{ p: 2, mb: 3 }}>
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
                  key={inv.groupKey}
                  invoiceInfo={{
                    inv: inv.inv,
                    po: inv.po,
                    etd: inv.etd,
                    eta: inv.eta,
                  }}
                  items={inv.items}
                  calendarDays={calendarDays}
                  editMode={editMode}
                  onUpdateHeader={(field, value) =>
                    updateHeader(inv.groupKey, field, value)
                  }
                  onUpdateSeq={(groupKey, seq, value) =>
                    updateSeq(groupKey, seq, value)
                  }
                />

              ))}
            </TableBody>
          </Table>
        </Paper>





      </Box>
      {/* ================================ */}


    </Box>
  );
}
