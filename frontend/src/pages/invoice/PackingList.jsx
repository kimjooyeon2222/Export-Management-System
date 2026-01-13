
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import { apiFetch } from "api/apiFetch";
import UnitSearchDialog from "components/dialog/UnitSearchDialog";

export default function PackingList() {
  const API = import.meta.env.VITE_API_URL;
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [targetRowId, setTargetRowId] = useState(null);
  const packingPlaceholders = {
    vendor: "거래처 선택",
    partNo: "품번 선택",
    partName: "품명 선택",
    spec: "규격 선택",
    unit: "UNIT 선택",
  };

  const handleSelectPackingItem = (item) => {
    if (!targetRowId) return;

    // 1️⃣ 화면 반영
    setRows(prev =>
      prev.map(r =>
        r.id === targetRowId
          ? {
            ...r,
            vendor: item.company_name || "",
            partNo: item.item_no || "",
            partName: item.item_name || "",
            spec: item.spec || "",
            unit: item.unit || "",
          }
          : r
      )
    );

    // 2️⃣ DB 반영
    apiFetch(`${API}/api/packing/${targetRowId}`, {
      method: "PUT",
      body: JSON.stringify({
        vendor: item.company_name || "",
        part_no: item.item_no || "",
        part_name: item.item_name || "",
        spec: item.spec || "",
        unit: item.unit || "",
      }),
    });

    setItemDialogOpen(false);
    setTargetRowId(null);
  };



  const { inv } = useParams();
  const [invoiceId, setInvoiceId] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // 🔥 invoice 테이블 - invoice_id 가져오기
  useEffect(() => {
    apiFetch(`${API}/api/invoice/${inv}`)
      .then(res => res.json())
      .then(data => {
        setInvoiceId(data.id); // invoice.id가 진짜 invoice_id
      })
      .catch(err => console.error("Invoice load error:", err));
  }, [inv]);
  console.log("🔥 inv from URL:", inv);
  console.log("🔥 Fetch URL:", `${API}/api/invoice/${inv}/packing`);
  console.log("🔥 URL inv:", JSON.stringify(inv));

  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);

  // SheetJS CDN 로드
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  // DB에서 packing list 불러오기
  const [rows, setRows] = useState([]);

  useEffect(() => {
    apiFetch(`${API}/api/invoice/${inv}/packing`)
      .then(res => res.json())
      .then(data => {


        const converted = data.map(r => ({
          id: r.id,
          invoice_id: r.invoice_id,
          po: r.po_no,
          vendor: r.vendor,
          partNo: r.part_no,
          partName: r.part_name,
          spec: r.spec,
          qty: r.qty,
          unit: r.unit
        }));
        setRows(converted);
      })
      .catch(err => console.error("PackingList DB load error:", err));
  }, [inv]);

  // 행 추가
  const handleAdd = async () => {
    // 1) DB에서 packing_list의 max(id) 가져오기
    const maxRes = await apiFetch(`${API}/api/packing/max-id`);
    const maxData = await maxRes.json();
    const nextId = (maxData.max_id || 0) + 1;

    // 2) 새 row 생성
    const newRow = {
      id: nextId,
      invoice_id: invoiceId,
      po_no: "",
      vendor: "",
      part_no: "",
      part_name: "",
      spec: "",
      qty: 0,
      unit: ""
    };

    // 3) DB INSERT
    const res = await apiFetch(`${API}/api/packing`, {
      method: "POST",
      body: JSON.stringify(newRow)
    });

    const created = await res.json();

    // 4) 화면 반영
    setRows(prev => [
      ...prev,
      {
        id: newRow.id,
        invoice_id: newRow.invoice_id,
        po: newRow.po_no,
        vendor: newRow.vendor,
        partNo: newRow.part_no,
        partName: newRow.part_name,
        spec: newRow.spec,
        qty: newRow.qty,
        unit: newRow.unit
      }
    ]);
  };



  // 행 수정
  const handleEdit = async (id, field, value) => {
    // 화면에서 즉시 반영
    setRows(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );

    const dbFieldMap = {
      po: "po_no",
      vendor: "vendor",
      partNo: "part_no",
      partName: "part_name",
      spec: "spec",
      qty: "qty",
      unit: "unit"
    };

    const payload = {
      [dbFieldMap[field]]: value
    };

    await apiFetch(`${API}/api/packing/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  };


  // 행 삭제
  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    await apiFetch(`${API}/api/packing/${id}`, {
      method: "DELETE"
    });

    setRows(prev => prev.filter(r => r.id !== id));
  };


  // 엑셀 업로드 (CDN SheetJS)

  const handleExcelUpload = async (event) => {
    if (!invoiceId) {
      alert("invoice ID 로딩 중입니다. 1초 뒤 다시 시도하세요.");
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = window.XLSX;
        if (!XLSX) {
          alert("⚠️ XLSX 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도하세요.");
          return;
        }

        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        console.log("📦 엑셀 데이터:", json);

        // 1) 업로드된 엑셀을 DB 형식으로 변환
        const converted = json.map((row) => ({
          po_no: row["PO번호"] || row["PO 번호"] || "",
          vendor: row["거래처"] || "",
          part_no: row["품번"] || "",
          part_name: row["품명"] || "",
          spec: row["규격"] || "",
          qty: Number(row["수량"] || row["수량"] || 0),
          unit: row["UNIT"] || row["Unit"] || row["unit"] || "EA",
          invoice_id: invoiceId,
        }));

        // 2) DB INSERT (여러 개 반복 저장)
        const insertedRows = [];

        for (let item of converted) {
          const res = await apiFetch(`${API}/api/packing`, {
            method: "POST",
            body: JSON.stringify(item),
          });

          const created = await res.json();
          insertedRows.push({
            id: created.id,
            invoice_id: item.invoice_id,
            po: item.po_no,
            vendor: item.vendor,
            partNo: item.part_no,
            partName: item.part_name,
            spec: item.spec,
            qty: item.qty,
            unit: item.unit,
          });
        }

        // 3) 화면 반영
        setRows((prev) => [...prev, ...insertedRows]);

        alert("엑셀 데이터가 성공적으로 업로드되고 DB에 저장되었습니다.");
      } catch (err) {
        console.error("❌ 엑셀 파싱 에러:", err);
        alert("엑셀 파일 처리 중 오류가 발생했습니다.");
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };


  return (
    <Box sx={{ bgcolor: "#fff", height: "100vh", p: 3 }}>
      {/* 제목 */}
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
        📦 PACKING LIST - {inv}
      </Typography>

      {/* 상단 버튼 */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{
            borderColor: "#b34b00",
            color: "#b34b00",
            fontWeight: "bold",
            "&:hover": { bgcolor: "#fff2e0" },
          }}
        >
          ← INVOICE로 돌아가기
        </Button>

        <Box sx={{ display: "flex", gap: 1 }}>

          {/* 🔵 엑셀 업로드 버튼 (수정모드 아니면 disabled) */}
          <Button
            variant="contained"
            color="info"
            size="small"
            component="label"
            disabled={!isEditMode}
          >
            엑셀 업로드
            <input
              type="file"
              accept=".xlsx, .xls"
              hidden
              onChange={handleExcelUpload}
              disabled={!isEditMode}
            />
          </Button>

          {/* 🟢 행 추가 버튼 (수정모드에서만 가능) */}
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={handleAdd}
            disabled={!isEditMode}
          >
            추가
          </Button>

          {/* 🟠 수정 모드 버튼 — 그대로 유지 */}
          <Button
            variant="contained"
            color={isEditMode ? "secondary" : "warning"}
            size="small"
            onClick={() => {
              setIsEditMode((prev) => {
                const newMode = !prev;
                alert(
                  newMode
                    ? "🔧 수정 모드가 활성화되었습니다.\n셀을 클릭하면 데이터를 편집할 수 있습니다."
                    : "✅ 수정 모드가 종료되었습니다.\n표는 다시 읽기 전용이 됩니다."
                );
                return newMode;
              });
            }}
          >
            {isEditMode ? "수정 종료" : "수정 모드"}
          </Button>

          {/* 🔴 삭제 버튼 (수정모드 아닐 때는 disabled) */}
          <Button
            variant="contained"
            color="error"
            size="small"
            disabled={!isEditMode}
            onClick={async () => {
              if (!isEditMode) return;

              if (!deleteMode) {
                setDeleteMode(true);
                alert("🗑 삭제 모드 활성화\n행을 클릭해서 선택하세요.");
                return;
              }

              if (selectedRows.length === 0) {
                alert("삭제할 항목이 없습니다.");
                setDeleteMode(false);
                return;
              }

              if (!window.confirm(`${selectedRows.length}개 항목을 삭제할까요?`)) {
                return;
              }

              for (const id of selectedRows) {
                await apiFetch(`${API}/api/packing/${id}`, { method: "DELETE" });
              }

              setRows(prev => prev.filter(r => !selectedRows.includes(r.id)));
              setSelectedRows([]);
              setDeleteMode(false);
            }}
          >
            {deleteMode ? "삭제 실행" : "삭제"}
          </Button>

        </Box>


      </Box>

      {/* 테이블 */}
      <Paper
        elevation={2}
        sx={{
          maxHeight: "88vh",
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 8 },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#ccc", borderRadius: 4 },
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: "#fff3cd" }}>
            <TableRow>
              {["PO번호", "거래처", "품번", "품명", "규격", "수량", "UNIT"].map((col) => (
                <TableCell key={col} align="center" sx={{ fontWeight: "bold" }}>
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, i) => (
              <TableRow
                key={row.id}
                sx={{
                  bgcolor: selectedRows.includes(row.id)
                    ? "#ffdddd"
                    : i % 2 === 0
                      ? "#ffffff"
                      : "#f8f8f8",
                  cursor: deleteMode ? "pointer" : "default"
                }}
                onClick={() => {
                  if (!deleteMode) return;

                  if (selectedRows.includes(row.id)) {
                    setSelectedRows(prev => prev.filter(id => id !== row.id));
                  } else {
                    setSelectedRows(prev => [...prev, row.id]);
                  }
                }}
              >

                {["po", "vendor", "partNo", "partName", "spec", "qty", "unit"].map(
                  (field, idx) => (
                    <TableCell
                      key={idx}
                      align="center"
                      sx={{
                        cursor: isEditMode ? "pointer" : "default",

                      }}
                      onClick={() => {

                        // 🔥 삭제 모드일 때는 수정 로직을 아예 막기
                        if (deleteMode) return;

                        // 🔥 수정 모드 아닐 때 → 아무것도 안 함
                        if (!isEditMode) return;

                        // 🔥 Dialog 적용 대상
                        if (["vendor", "partNo", "partName", "spec", "unit"].includes(field)) {
                          setTargetRowId(row.id);
                          setItemDialogOpen(true);
                          return;
                        }


                        // 🔥 spec도 prompt 금지 (Dialog only)
                        if (field === "spec") return;
                        // 🔥 UNIT 은 클릭 시 prompt 금지 → select 로만 수정
                        if (field === "unit") return;

                        // 🔥 기본 prompt 방식 유지
                        const value = prompt(`${field} 수정`, String(row[field] || ""));
                        if (value !== null) handleEdit(row.id, field, value);
                      }}

                    >

                      {isEditMode && ["vendor", "partNo", "partName", "spec", "unit"].includes(field) ? (
                        <input
                          readOnly
                          value={row[field] || ""}
                          placeholder={packingPlaceholders[field] || "선택"}
                          style={{
                            width: "100%",
                            textAlign: "center",
                            fontWeight: "bold",
                            cursor: "pointer",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            padding: "4px",
                            background: "#fff",
                          }}
                        />
                      ) : (
                        field === "qty"
                          ? Number(row[field]).toLocaleString()
                          : row[field]
                      )}


                    </TableCell>

                  )
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <UnitSearchDialog
        open={itemDialogOpen}
        onClose={() => {
          setItemDialogOpen(false);
          setTargetRowId(null);
        }}
        onSelect={handleSelectPackingItem}
      />

    </Box>
  );
}
