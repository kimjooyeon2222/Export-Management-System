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
  const { inv } = useParams();
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

  // LocalStorage 불러오기
  const savedData = JSON.parse(localStorage.getItem(`packing_${inv}`) || "[]");
  const [rows, setRows] = useState(
    savedData.length
      ? savedData
      : [
          {
            id: 1,
            po: "450001",
            vendor: "와이엠",
            partNo: "A10U8741",
            partName: "M5 X 14 BOLT ASSY",
            spec: "Ø110×Ø140(M42×3P)",
            qty: 196000,
          },
          {
            id: 2,
            po: "450002",
            vendor: "와이엠",
            partNo: "A10U8742",
            partName: "M5 X 16 BOLT ASSY",
            spec: "Ø90×Ø140(M60×3P)",
            qty: 132000,
          },
        ]
  );

  // LocalStorage 자동 저장
  useEffect(() => {
  // 1) 개별 INV 저장
  localStorage.setItem(`packing_${inv}`, JSON.stringify(rows));

  // 2) 전체 통합 리스트에도 반영
  const allData = JSON.parse(localStorage.getItem("packingListData") || "[]");

  // 기존 같은 INV 데이터 제거 후 새로 추가
  const filtered = allData.filter((item) => item.inv !== inv);

  const updated = [
    ...filtered,
    ...rows.map((r) => ({
      inv,
      po: r.po,
      vendor: r.vendor,
      partNo: r.partNo,
      partName: r.partName,
      spec: r.spec,
      qty: r.qty,
    })),
  ];

  localStorage.setItem("packingListData", JSON.stringify(updated));
}, [rows, inv]);


  // 행 추가
  const handleAdd = () => {
    const newRow = {
      id: rows[rows.length - 1]?.id + 1 || 1,
      po: "",
      vendor: "",
      partNo: "",
      partName: "",
      spec: "",
      qty: 0,
    };
    setRows([...rows, newRow]);
  };

  // 행 수정
  const handleEdit = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // 행 삭제
  const handleDelete = (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // 엑셀 업로드 (CDN SheetJS)
  const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const XLSX = window.XLSX;
        if (!XLSX) {
          alert("⚠️ XLSX 라이브러리를 아직 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
          return;
        }

        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        console.log("📦 엑셀 데이터:", json);

        const converted = json.map((row, index) => ({
          id: rows.length + index + 1,
          po: row["PO번호"] || row["PO 번호"] || "",
          vendor: row["거래처"] || "",
          partNo: row["품번"] || "",
          partName: row["품명"] || "",
          spec: row["규격"] || "",
          qty: Number(row["수량(EA)"] || row["수량"] || 0),
        }));

        setRows((prev) => [...prev, ...converted]);
        alert("엑셀 데이터가 성공적으로 업로드되었습니다.");
      } catch (err) {
        console.error("❌ 엑셀 파싱 에러:", err);
        alert("엑셀 파일을 읽는 중 오류가 발생했습니다.");
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
              {["ID", "PO번호", "거래처", "품번", "품명", "규격", "수량(EA)"].map((col) => (
                <TableCell key={col} align="center" sx={{ fontWeight: "bold" }}>
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={row.id} sx={{ bgcolor: i % 2 === 0 ? "#ffffff" : "#f8f8f8" }}>
                {["id", "po", "vendor", "partNo", "partName", "spec", "qty"].map(
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
