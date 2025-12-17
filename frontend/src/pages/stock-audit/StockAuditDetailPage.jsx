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
import { useState } from "react";
import ItemSearchDialog from "components/dialog/ItemSearchDialog"; 
import { useParams, useNavigate } from "react-router-dom";
import UploadFileIcon from "@mui/icons-material/UploadFile";

export default function StockAuditDetailPage() {
const [editMode, setEditMode] = useState(false);
const [dirty, setDirty] = useState(false);

 const handleExcelUpload = e => {
  const file = e.target.files[0];
  if (!file) return;

  console.log("엑셀 업로드 파일:", file.name);

  // TODO (다음 단계)
  // 1. SheetJS(xlsx)로 파싱
  // 2. rows 형식으로 변환
  // 3. setRows(...)
};


  const { auditDate } = useParams();
const navigate = useNavigate();

  const [rows, setRows] = useState([]);

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
        id: Date.now(),
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
  const handleChange = (id, field, value) => {
  setDirty(true);
  setRows(prev =>
    prev.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    )
  );
};

  /* ===============================
     Item 선택 결과 반영
  =============================== */
  const handleSelectItem = item => {
    setRows(prev =>
      prev.map(r =>
        r.id === targetRowId
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

  const handleDelete = id => {
    setRows(prev => prev.filter(r => r.id !== id));
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
        sx={{ fontWeight: "bold" }}
        onClick={() => {
          // TODO: 저장 API 연결
          setEditMode(false);
          setDirty(false);
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
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>품번</TableCell>
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>품명</TableCell>
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>업체명</TableCell>
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>실사수량</TableCell>
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>불량</TableCell>
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>발청소재</TableCell>
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>적정재고</TableCell>
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>박스입수량</TableCell>
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>삭제</TableCell>
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
                <TableRow key={row.id}>
                  {/* 품번 */}
                  <TableCell align="center" onClick={() => {
                    setTargetRowId(row.id);
                    setDialogOpen(true);
                  }}>
                    <TextField
                      size="small"
                      value={row.itemNo}
                      placeholder="품번 선택"
                      InputProps={{ readOnly: true }}
                      inputProps={{ style: { textAlign: "center", cursor: "pointer" } }}
                    />
                  </TableCell>

                  {/* 품명 */}
                  <TableCell align="center" onClick={() => {
                    setTargetRowId(row.id);
                    setDialogOpen(true);
                  }}>
                    <TextField
                      size="small"
                      value={row.itemName}
                      placeholder="품명"
                      InputProps={{ readOnly: true }}
                      inputProps={{ style: { textAlign: "center", cursor: "pointer" } }}
                    />
                  </TableCell>

                  {/* 업체명 */}
                  <TableCell align="center" onClick={() => {
                    setTargetRowId(row.id);
                    setDialogOpen(true);
                  }}>
                    <TextField
                      size="small"
                      value={row.vendorName}
                      placeholder="업체명"
                      InputProps={{ readOnly: true }}
                      inputProps={{ style: { textAlign: "center", cursor: "pointer" } }}
                    />
                  </TableCell>

                  {/* 실사수량 */}
                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={row.auditQty}
                      onChange={e =>
                        handleChange(row.id, "auditQty", Number(e.target.value))
                      }
                      inputProps={{ style: { textAlign: "center" } }}
                    />
                  </TableCell>

                  {/* 불량 */}
                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={row.defectQty}
                      onChange={e =>
                        handleChange(row.id, "defectQty", Number(e.target.value))
                      }
                      inputProps={{ style: { textAlign: "center" } }}
                    />
                  </TableCell>

                  {/* 발청소재 */}
                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={row.shortageQty}
                      onChange={e =>
                        handleChange(row.id, "shortageQty", Number(e.target.value))
                      }
                      inputProps={{ style: { textAlign: "center" } }}
                    />
                  </TableCell>

                  {/* 적정재고 */}
                  <TableCell align="center">
  <TextField
    size="small"
    type="number"
    value={row.optimalQty}
    onChange={e =>
      handleChange(row.id, "optimalQty", Number(e.target.value))
    }
    inputProps={{ style: { textAlign: "center" } }}
  />
</TableCell>


                  {/* 박스 입수량 */}
                  <TableCell align="center">
  <TextField
    size="small"
    type="number"
    value={row.boxQty}
    onChange={e =>
      handleChange(row.id, "boxQty", Number(e.target.value))
    }
    inputProps={{ style: { textAlign: "center" } }}
  />
</TableCell>


                  {/* 삭제 */}
                  <TableCell align="center">
                    <IconButton onClick={() => handleDelete(row.id)}>
                      <DeleteIcon />
                    </IconButton>
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
