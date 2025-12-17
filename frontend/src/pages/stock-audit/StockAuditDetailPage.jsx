// frontend/src/pages/stock-audit/StockAuditDetailPage.jsx
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
import { useParams } from "react-router-dom";
import { useState } from "react";

export default function StockAuditDetailPage() {
  const { auditDate } = useParams(); // 예: 2025-11-03

  /* ===============================
     실사 품목 데이터
  =============================== */
  const [rows, setRows] = useState([]);

  /* ===============================
     품목 추가 (임시)
     → 다음 단계에서 ItemSearchDialog 연결
  =============================== */
  const handleAddItem = () => {
    setRows(prev => [
      ...prev,
      {
        id: Date.now(),
        itemNo: "",
        itemName: "",
        auditQty: 0,        // 실사수량
        defectQty: 0,       // 불량
        shortageQty: 0,     // 발청소재
        optimalQty: 0,      // 적정재고
        boxQty: 0           // 박스 입수량
      }
    ]);
  };

  /* ===============================
     값 변경
  =============================== */
  const handleChange = (id, field, value) => {
    setRows(prev =>
      prev.map(r =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  /* ===============================
     행 삭제
  =============================== */
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

      {/* 액션 영역 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Button variant="contained" onClick={handleAddItem}>
          + 품목 추가
        </Button>
      </Paper>

      {/* 실사 테이블 */}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>품번</TableCell>
              <TableCell>품명</TableCell>
              <TableCell align="right">실사수량</TableCell>
              <TableCell align="right">불량</TableCell>
              <TableCell align="right">발청소재</TableCell>
              <TableCell align="right">적정재고</TableCell>
              <TableCell align="right">박스입수량</TableCell>
              <TableCell align="center">삭제</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  품목을 추가하세요.
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => (
                <TableRow key={row.id}>
                  {/* 품번 */}
                  <TableCell>
                    <TextField
                      size="small"
                      value={row.itemNo}
                      placeholder="품번 선택"
                      InputProps={{ readOnly: true }}
                    />
                  </TableCell>

                  {/* 품명 */}
                  <TableCell>
                    <TextField
                      size="small"
                      value={row.itemName}
                      placeholder="품명"
                      InputProps={{ readOnly: true }}
                    />
                  </TableCell>

                  {/* 실사수량 */}
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={row.auditQty}
                      onChange={e =>
                        handleChange(row.id, "auditQty", Number(e.target.value))
                      }
                    />
                  </TableCell>

                  {/* 불량 */}
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={row.defectQty}
                      onChange={e =>
                        handleChange(row.id, "defectQty", Number(e.target.value))
                      }
                    />
                  </TableCell>

                  {/* 발청소재 */}
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={row.shortageQty}
                      onChange={e =>
                        handleChange(row.id, "shortageQty", Number(e.target.value))
                      }
                    />
                  </TableCell>

                  {/* 적정재고 */}
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={row.optimalQty}
                      InputProps={{ readOnly: true }}
                    />
                  </TableCell>

                  {/* 박스 입수량 */}
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={row.boxQty}
                      InputProps={{ readOnly: true }}
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

      {/* 저장 */}
      <Box sx={{ mt: 2, textAlign: "right" }}>
        <Button variant="contained">
          저장
        </Button>
      </Box>
    </Box>
  );
}
