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

export default function ItemSearchDialog({ open, onClose, onSelect }) {
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!open) return;

    const fetchItems = async () => {
      const API = import.meta.env.VITE_API_URL;
      

      const url = `${API}/api/items/search?keyword=${encodeURIComponent(keyword)}`;
      console.log("🔥 ItemSearchDialog fetch:", url);

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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
          placeholder="품번 / 품명 / 업체명 검색"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">품번</TableCell>
                <TableCell align="center">품명</TableCell>
                <TableCell align="center">업체명</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    검색 결과가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(item => (
                  <TableRow
                    key={item.id}
                    hover
                    onClick={() => setSelected(item)}
                    onDoubleClick={() => {
                      onSelect(item);
                      handleClose();
                    }}
                  >
                    <TableCell align="center">{item.item_no}</TableCell>
                    <TableCell align="center">{item.item_name}</TableCell>
                    <TableCell align="center">{item.company_name}</TableCell>
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