import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Box,
  Button
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import { apiFetch } from "api/apiFetch";

// 🔥 ItemSearchDialog 그대로 + 컬럼만 확장
export default function UnitSearchDialog({ open, onClose, onSelect }) {
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!open) return;

    const fetchItems = async () => {
      const API = import.meta.env.VITE_API_URL;
      const url = `${API}/api/items/search?keyword=${encodeURIComponent(keyword)}`;
      console.log("🔥 UnitSearchDialog fetch:", url);

      const res = await apiFetch(url);
      const data = await res.json();
      setRows(data);
    };

    fetchItems();
  }, [open, keyword]);

  const handleClose = () => {
    setKeyword("");
    setRows([]);
    setSelected(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        품목 선택
        <IconButton onClick={handleClose} sx={{ float: "right" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          size="small"
          placeholder="품번 / 품명 / 업체명 / 규격 / 단위 검색"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  품번
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  품명
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  업체명
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  규격
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  단위
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    검색 결과가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(item => (
                  <TableRow
                    key={item.id}
                    hover
                    selected={selected?.id === item.id}
                    onClick={() => setSelected(item)}
                    onDoubleClick={() => {
                      onSelect(item);
                      handleClose();
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell align="center">{item.item_no}</TableCell>
                    <TableCell align="center">{item.item_name}</TableCell>
                    <TableCell align="center">{item.company_name}</TableCell>
                    <TableCell align="center">{item.spec}</TableCell>
                    <TableCell align="center">{item.unit}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ textAlign: "right", mt: 2 }}>
          <Button
            variant="contained"
            disabled={!selected}
            onClick={() => {
              onSelect(selected);
              handleClose();
            }}
          >
            선택
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
