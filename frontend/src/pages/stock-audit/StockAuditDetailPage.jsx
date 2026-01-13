import {
    Box,
    Typography,
    Paper,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TextField,
    IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState, useEffect } from "react";
import ItemSearchDialog from "components/dialog/ItemSearchDialog";
import { useParams, useNavigate } from "react-router-dom";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { apiFetch } from "api/apiFetch";

export default function StockAuditDetailPage() {
    // 숫자 포맷 (1,000 단위 콤마)
    const fmt = (num) =>
        typeof num === "number"
            ? num.toLocaleString()
            : num
                ? Number(num).toLocaleString()
                : "0";

    useEffect(() => {
        const script = document.createElement("script");
        script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script.async = true;
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
    }, []);

    const [editMode, setEditMode] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [auditDate, setAuditDate] = useState("");
    const handleExcelUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const XLSX = window.XLSX;
                if (!XLSX) {
                    alert("⚠️ XLSX 라이브러리가 아직 로드되지 않았습니다.");
                    return;
                }

                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet);

                console.log("📊 재고실사 엑셀 데이터:", json);

                const converted = json.map(row => ({
                    id: null,
                    tempId: crypto.randomUUID(),
                    itemNo: row["품번"] || "",
                    itemName: row["품명"] || "",
                    vendorName: row["업체명"] || "",
                    auditQty: Number(row["실사수량"] || 0),
                    defectQty: Number(row["불량"] || 0),
                    shortageQty: Number(row["발청소재"] || 0),
                    optimalQty: Number(row["적정재고"] || 0),
                    boxQty: Number(row["박스입수량"] || 0)
                }));

                setRows(prev => [...prev, ...converted]);
                setDirty(true);

                alert(`✅ 엑셀 ${converted.length}건 업로드 완료`);
            } catch (err) {
                console.error("❌ 재고실사 엑셀 파싱 오류:", err);
                alert("엑셀 파일 처리 중 오류가 발생했습니다.");
            }
        };

        reader.readAsArrayBuffer(file);
        event.target.value = "";
    };



    const { auditId } = useParams();
    const navigate = useNavigate();

    const [rows, setRows] = useState([]);
    useEffect(() => {
        apiFetch(`${import.meta.env.VITE_API_URL}/api/stock-audits/${auditId}`)
            .then(res => res.json())
            .then(data => {
                setAuditDate(data.audit_date);

                const converted = data.items.map(i => ({
                    id: i.id,
                    itemNo: i.item_no,
                    itemName: i.item_name,
                    vendorName: i.company_name,
                    auditQty: i.audit_qty,
                    defectQty: i.defect_qty,
                    shortageQty: i.shortage_qty,
                    optimalQty: i.optimal_qty,
                    boxQty: i.box_qty
                }));

                setRows(converted);
            })
            .catch(err => {
                console.error("재고실사 상세 조회 실패", err);
            });
    }, [auditId]);

    /* ===============================
       Item Search Dialog 상태
    =============================== */
    const [dialogOpen, setDialogOpen] = useState(false);
    const [targetRowId, setTargetRowId] = useState(null);

    /* ===============================
       품목 추가
    =============================== */
    const handleAddItem = () => {
        setRows(prev => [
            ...prev,
            {
                id: null,
                tempId: crypto.randomUUID(),
                itemNo: "",
                itemName: "",
                vendorName: "",
                auditQty: 0,
                defectQty: 0,
                shortageQty: 0,
                optimalQty: 0,
                boxQty: 0
            }
        ]);
    };

    /* ===============================
       값 변경
    =============================== */
    const handleChange = (key, field, value) => {
        setDirty(true);
        setRows(prev =>
            prev.map(r =>
                (r.id ?? r.tempId) === key
                    ? { ...r, [field]: value }
                    : r
            )
        );
    };


    /* ===============================
       Item 선택 결과 반영
    =============================== */
    const handleSelectItem = item => {
        setRows(prev =>
            prev.map(r =>
                (r.id ?? r.tempId) === targetRowId
                    ? {
                        ...r,
                        itemNo: item.item_no,
                        itemName: item.item_name,
                        vendorName: item.company_name,

                    }
                    : r
            )
        );
    };

    const handleDelete = key => {
        setRows(prev =>
            prev.filter(r => (r.id ?? r.tempId) !== key)
        );
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                재고실사 상세 관리
            </Typography>

            <Typography sx={{ mb: 2 }}>
                실사일자: <b>{auditDate}</b>
            </Typography>

            <Paper
                sx={{
                    p: 2,
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                }}
            >
                {/* 뒤로가기 */}
                <Button
                    variant="outlined"
                    onClick={() => {
                        if (dirty && editMode) {
                            if (!window.confirm("저장되지 않은 내용이 있습니다. 이동하시겠습니까?")) {
                                return;
                            }
                        }
                        navigate(-1);
                    }}
                >
                    ← 뒤로가기
                </Button>

                {/* 가운데 밀기 */}
                <Box sx={{ flexGrow: 1 }} />

                {/* ===== 조회 모드 ===== */}
                {!editMode && (
                    <Button
                        variant="outlined"
                        sx={{ fontWeight: "bold" }}
                        onClick={() => setEditMode(true)}
                    >
                        수정
                    </Button>
                )}

                {/* ===== 수정 모드 ===== */}
                {editMode && (
                    <>
                        <Button
                            variant="contained"
                            onClick={() => {
                                handleAddItem();
                                setDirty(true);
                            }}
                        >
                            + 품목 추가
                        </Button>

                        <Button
                            variant="contained"
                            component="label"
                            startIcon={<UploadFileIcon />}
                        >
                            엑셀 업로드
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                hidden
                                onChange={e => {
                                    handleExcelUpload(e);
                                    setDirty(true);
                                }}
                            />
                        </Button>

                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => {
                                apiFetch(`${import.meta.env.VITE_API_URL}/api/stock-audit-items/bulk`, {
                                    method: "POST",
                                    body: JSON.stringify({
                                        audit_id: Number(auditId),
                                        items: rows.map(r => ({
                                            id: r.id,
                                            item_no: r.itemNo,
                                            item_name: r.itemName,
                                            company_name: r.vendorName,
                                            audit_qty: r.auditQty,
                                            defect_qty: r.defectQty,
                                            shortage_qty: r.shortageQty,
                                            optimal_qty: r.optimalQty,
                                            box_qty: r.boxQty
                                        }))
                                    })
                                })
                                    .then(() => {
                                        alert("저장 완료");
                                        setEditMode(false);
                                        setDirty(false);
                                    })
                                    .catch(err => {
                                        alert("저장 실패");
                                        console.error(err);
                                    });
                            }}
                        >
                            저장
                        </Button>


                        <Button
                            variant="outlined"
                            color="error"
                            onClick={() => {
                                if (
                                    !dirty ||
                                    window.confirm("저장하지 않고 수정모드를 종료하시겠습니까?")
                                ) {
                                    setEditMode(false);
                                    setDirty(false);
                                }
                            }}
                        >
                            종료
                        </Button>
                    </>
                )}
            </Paper>





            <Paper>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "16px" }}>품번</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "16px" }}>품명</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "16px" }}>업체명</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "16px" }}>실사수량</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "16px" }}>불량</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "16px" }}>발청소재</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "16px" }}>적정재고</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "16px" }}>박스입수량</TableCell>
                            {editMode && (
                                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "16px" }}>삭제</TableCell>
                            )}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    품목을 추가하세요.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map(row => (
                                <TableRow key={row.id ?? row.tempId}>
                                    {/* 품번 */}
                                    <TableCell
                                        align="center"
                                        onClick={() => {
                                            if (!editMode) return;
                                            setTargetRowId(row.id ?? row.tempId);
                                            setDialogOpen(true);
                                        }}
                                    >
                                        {editMode ? (
                                            <TextField
                                                size="small"
                                                value={row.itemNo}
                                                placeholder="품번 선택"
                                                InputProps={{ readOnly: true }}
                                                inputProps={{ style: { textAlign: "center", cursor: "pointer", fontSize: "15px" } }}
                                            />
                                        ) : (
                                            <Typography sx={{ fontSize: "15px", fontWeight: "bold" }}>{row.itemNo || "-"}</Typography>
                                        )}
                                    </TableCell>


                                    {/* 품명 */}
                                    <TableCell
                                        align="center"
                                        onClick={() => {
                                            if (!editMode) return;
                                            setTargetRowId(row.id ?? row.tempId);
                                            setDialogOpen(true);
                                        }}
                                    >
                                        {editMode ? (
                                            <TextField
                                                size="small"
                                                value={row.itemName}
                                                placeholder="품명 선택"
                                                InputProps={{ readOnly: true }}
                                                inputProps={{ style: { textAlign: "center", cursor: "pointer" } }}
                                            />
                                        ) : (
                                            <Typography sx={{ fontSize: "15px", fontWeight: "bold" }}>
                                                {row.itemName || "-"}
                                            </Typography>

                                        )}
                                    </TableCell>


                                    {/* 업체명 */}
                                    <TableCell
                                        align="center"
                                        onClick={() => {
                                            if (!editMode) return;
                                            setTargetRowId(row.id ?? row.tempId);
                                            setDialogOpen(true);
                                        }}
                                    >
                                        {editMode ? (
                                            <TextField
                                                size="small"
                                                value={row.vendorName}
                                                placeholder="업체명 선택"
                                                InputProps={{ readOnly: true }}
                                                inputProps={{ style: { textAlign: "center", cursor: "pointer" } }}
                                            />
                                        ) : (
                                            <Typography sx={{ fontSize: "15px", fontWeight: "bold" }}>
                                                {row.vendorName || "-"}
                                            </Typography>

                                        )}
                                    </TableCell>


                                    {/* 실사수량 */}
                                    <TableCell align="center">
                                        {editMode ? (
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={row.auditQty}
                                                onChange={e =>
                                                    handleChange(row.id ?? row.tempId, "auditQty", Number(e.target.value))
                                                }
                                                inputProps={{ style: { textAlign: "center" } }}
                                            />
                                        ) : (
                                            <Typography sx={{ fontSize: "15px", fontWeight: "bold" }}>
                                                {fmt(row.auditQty)}
                                            </Typography>

                                        )}
                                    </TableCell>


                                    {/* 불량 */}
                                    <TableCell align="center">
                                        {editMode ? (
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={row.defectQty}
                                                onChange={e =>
                                                    handleChange(row.id ?? row.tempId, "defectQty", Number(e.target.value))
                                                }
                                                inputProps={{ style: { textAlign: "center" } }}
                                            />
                                        ) : (
                                            <Typography sx={{ fontSize: "15px", fontWeight: "bold" }}>
                                                {fmt(row.defectQty)}
                                            </Typography>

                                        )}
                                    </TableCell>


                                    {/* 발청소재 */}
                                    <TableCell align="center">
                                        {editMode ? (
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={row.shortageQty}
                                                onChange={e =>
                                                    handleChange(row.id ?? row.tempId, "shortageQty", Number(e.target.value))
                                                }
                                                inputProps={{ style: { textAlign: "center" } }}
                                            />
                                        ) : (
                                            <Typography sx={{ fontSize: "15px", fontWeight: "bold" }}>
                                                {fmt(row.shortageQty)}
                                            </Typography>

                                        )}
                                    </TableCell>


                                    {/* 적정재고 */}
                                    <TableCell align="center">
                                        {editMode ? (
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={row.optimalQty}
                                                onChange={e =>
                                                    handleChange(row.id ?? row.tempId, "optimalQty", Number(e.target.value))
                                                }
                                                inputProps={{ style: { textAlign: "center" } }}
                                            />
                                        ) : (
                                            <Typography sx={{ fontSize: "15px", fontWeight: "bold" }}>
                                                {fmt(row.optimalQty)}
                                            </Typography>


                                        )}
                                    </TableCell>



                                    {/* 박스 입수량 */}
                                    <TableCell align="center">
                                        {editMode ? (
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={row.boxQty}
                                                onChange={e =>
                                                    handleChange(row.id ?? row.tempId, "boxQty", Number(e.target.value))
                                                }
                                                inputProps={{ style: { textAlign: "center" } }}
                                            />
                                        ) : (
                                            <Typography sx={{ fontSize: "15px", fontWeight: "bold" }}>
                                                {fmt(row.boxQty)}
                                            </Typography>


                                        )}
                                    </TableCell>



                                    {/* 삭제 */}
                                    <TableCell align="center">
                                        {editMode && (
                                            <IconButton onClick={() => handleDelete(row.id ?? row.tempId)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>

                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Paper>

            <Box sx={{ mt: 2, textAlign: "right" }}>
            </Box>

            {/* ===============================
         Item Search Dialog
      =============================== */}
            <ItemSearchDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleSelectItem}
            />
        </Box>
    );
}
