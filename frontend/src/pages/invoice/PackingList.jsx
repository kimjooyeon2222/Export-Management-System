
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

export default function PackingList() {

  const API = import.meta.env.VITE_API_URL;

  const { inv } = useParams();
    console.log("🔥 inv from URL:", inv);
console.log("🔥 Fetch URL:", `${API}/api/invoice/${inv}/packing`);
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [userRole] = useState("admin");

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
    fetch(`${API}/api/invoice/${inv}/packing`)
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
    const newRow = {
      invoice_id: rows.length ? rows[0].invoice_id : null, // 이미 불러온 데이터의 invoice_id 사용
      po_no: "",
      vendor: "",
      part_no: "",
      part_name: "",
      spec: "",
      qty: 0,
      unit: "EA"
    };

    const res = await fetch(`${API}/api/packing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRow)
    });

    const created = await res.json();

    // 화면에도 추가
    setRows(prev => [
      ...prev,
      {
        id: created.id,
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

    await fetch(`${API}/api/packing/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  };


  // 행 삭제
  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    await fetch(`${API}/api/packing/${id}`, {
      method: "DELETE"
    });

    setRows(prev => prev.filter(r => r.id !== id));
  };


  // 엑셀 업로드 (CDN SheetJS)
  
  const handleExcelUpload = async (event) => {
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
          qty: Number(row["수량(EA)"] || row["수량"] || 0),
          unit: "EA",
          invoice_id: rows.length ? rows[0].invoice_id : null,
        }));

        // 2) DB INSERT (여러 개 반복 저장)
        const insertedRows = [];

        for (let item of converted) {
          const res = await fetch(`${API}/api/packing`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

        {/* 관리자 전용 버튼 */}
        {userRole === "admin" && (
          <Box sx={{ display: "flex", gap: 1 }}>
            {/* 엑셀 업로드 버튼 */}
            <Button variant="contained" color="info" size="small" component="label">
              엑셀 업로드
              <input
                type="file"
                accept=".xlsx, .xls"
                hidden
                onChange={handleExcelUpload}
              />
            </Button>

            <Button variant="contained" color="success" size="small" onClick={handleAdd}>
              추가
            </Button>

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

            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => {
                const id = prompt("삭제할 ID를 입력하세요:");
                if (id) handleDelete(Number(id));
              }}
            >
              삭제
            </Button>
          </Box>
        )}
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
              {["ID", "PO번호", "거래처", "품번", "품명", "규격", "수량(EA)","UNIT"].map((col) => (
                <TableCell key={col} align="center" sx={{ fontWeight: "bold" }}>
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={row.id} sx={{ bgcolor: i % 2 === 0 ? "#ffffff" : "#f8f8f8" }}>
                {["id", "po", "vendor", "partNo", "partName", "spec", "qty","unit"].map(
                  (field, idx) => (
                    <TableCell
                      key={idx}
                      align="center"
                      sx={{
                        cursor:
                          isEditMode && userRole === "admin" ? "pointer" : "default",
                      }}
                      onClick={() => {
                        if (!isEditMode || userRole !== "admin") return;
                        const value = prompt(`${field} 수정`, String(row[field] || ""));
                        if (value !== null) handleEdit(row.id, field, value);
                      }}
                    >
                      {field === "qty"
                        ? Number(row[field]).toLocaleString()
                        : row[field]}
                    </TableCell>
                  )
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
