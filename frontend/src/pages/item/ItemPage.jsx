import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@mui/material";
import { useState } from "react";
import { useEffect } from "react";

import { apiFetch } from "api/apiFetch";


export default function ItemPage() {

    useEffect(() => {
  handleSearch();
}, []);
  /* ===================== 상태 ===================== */
  const [rows, setRows] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const [search, setSearch] = useState({
    itemNo: "",
    itemName: "",
    spec: "",
    material: "",
    itemType: "",
    unit: "",
    orderBy: "itemNo",
    limit: 200
  });

  /* ===================== 검색 ===================== */
  const handleSearchChange = (e) => {
    setSearch({ ...search, [e.target.name]: e.target.value });
  };

const handleSearch = async () => {
  const params = new URLSearchParams(search).toString();

  const res = await apiFetch(
    `${import.meta.env.VITE_API_URL}/api/items?${params}`
  );

  const data = await res.json();

  setRows(
    data.map(row => ({
      ...row,
      tempId: row.id
    }))
  );
};

 

  /* ===================== CRUD ===================== */
  const addItemRow = () => {
    if (!editMode) return;

    setRows(prev => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        item_no: "",
        item_name: "",
        spec: "",
        material: "",
        item_type: "",
        unit: "EA",
        created_at: "",
        updated_at: ""
      }
    ]);
  };

  const toggleDeleteMode = () => {
    if (!editMode) return;

    if (!deleteMode) {
      setDeleteMode(true);
      setSelectedRows([]);
      alert("🗑 삭제 모드 활성화\n삭제할 품목을 선택하세요.");
    } else {
      if (selectedRows.length === 0) {
        alert("삭제할 품목이 선택되지 않았습니다.");
        return;
      }

      if (!window.confirm(`${selectedRows.length}개 품목을 삭제할까요?`)) return;

      setRows(prev => prev.filter(r => !selectedRows.includes(r.tempId)));
      setSelectedRows([]);
      setDeleteMode(false);
    }
  };

  const handleCellChange = (id, field, value) => {
    if (!editMode || deleteMode) return;

    setRows(prev =>
      prev.map(row =>
        row.tempId === id ? { ...row, [field]: value } : row
      )
    );
  };

  /* ===================== UI ===================== */
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        품목관리
      </Typography>

      {/* 🔹 버튼 영역 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 2 }}>
        <Button variant="contained" onClick={addItemRow} disabled={!editMode}>
          + 품목등록
        </Button>

        <Button
          variant="contained"
          color={deleteMode ? "error" : "warning"}
          onClick={toggleDeleteMode}
          disabled={!editMode}
        >
          {deleteMode ? "삭제 실행" : "삭제"}
        </Button>

        <Button
          variant="outlined"
          onClick={() => {
            setEditMode(prev => !prev);
            setDeleteMode(false);
            setSelectedRows([]);
          }}
          sx={{ fontWeight: "bold" }}
        >
          {editMode ? "수정모드 종료" : "수정모드 활성화"}
        </Button>
      </Box>

      {/* ================= 검색 영역 ================= */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <TextField label="품목번호" name="itemNo" fullWidth value={search.itemNo} onChange={handleSearchChange} />
          </Grid>
          <Grid item xs={3}>
            <TextField label="품목명" name="itemName" fullWidth value={search.itemName} onChange={handleSearchChange} />
          </Grid>
          <Grid item xs={3}>
            <TextField label="규격" name="spec" fullWidth value={search.spec} onChange={handleSearchChange} />
          </Grid>
          <Grid item xs={3}>
            <TextField label="재질" name="material" fullWidth value={search.material} onChange={handleSearchChange} />
          </Grid>

          <Grid item xs={3}>
            <Select fullWidth name="itemType" value={search.itemType} onChange={handleSearchChange} displayEmpty>
              <MenuItem value="">제품유형(전체)</MenuItem>
              <MenuItem value="PRODUCT">제품</MenuItem>
              <MenuItem value="RAW">원자재</MenuItem>
              <MenuItem value="SUB">부자재</MenuItem>
              <MenuItem value="CONSUMABLE">소모자재</MenuItem>
              <MenuItem value="TOOL">공구</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={3}>
            <Select fullWidth name="unit" value={search.unit} onChange={handleSearchChange} displayEmpty>
              <MenuItem value="">단위(전체)</MenuItem>
              <MenuItem value="EA">EA</MenuItem>
              <MenuItem value="KG">KG</MenuItem>
              <MenuItem value="SET">SET</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={3}>
            <Select fullWidth name="orderBy" value={search.orderBy} onChange={handleSearchChange}>
              <MenuItem value="itemNo">품목번호순</MenuItem>
              <MenuItem value="itemName">품목명순</MenuItem>
              <MenuItem value="material">재질순</MenuItem>
              <MenuItem value="spec">규격순</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={3}>
            <TextField label="최대검색수" name="limit" type="number" fullWidth value={search.limit} onChange={handleSearchChange} />
          </Grid>

          <Grid item xs={12} textAlign="right">
            <Button variant="contained" onClick={handleSearch}>
              조회
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ================= 리스트 ================= */}
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>품목번호</TableCell>
              <TableCell>품목명</TableCell>
              <TableCell>규격</TableCell>
              <TableCell>재질</TableCell>
              <TableCell>제품유형</TableCell>
              <TableCell>단위</TableCell>
              <TableCell>등록일시</TableCell>
              <TableCell>수정일시</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  조회된 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}

            {rows.map(row => (
              <TableRow
                key={row.tempId}
                hover
                sx={{
                  cursor: deleteMode ? "pointer" : "default",
                  bgcolor: selectedRows.includes(row.tempId)
                    ? "#ffdddd"
                    : "inherit"
                }}
                onClick={() => {
                  if (!deleteMode) return;

                  setSelectedRows(prev =>
                    prev.includes(row.tempId)
                      ? prev.filter(id => id !== row.tempId)
                      : [...prev, row.tempId]
                  );
                }}
              >
                <TableCell>
                  {editMode ? (
                    <TextField size="small" value={row.item_no} onChange={e => handleCellChange(row.tempId, "item_no", e.target.value)} />
                  ) : row.item_no}
                </TableCell>

                <TableCell>
                  {editMode ? (
                    <TextField size="small" value={row.item_name} onChange={e => handleCellChange(row.tempId, "item_name", e.target.value)} />
                  ) : row.item_name}
                </TableCell>

                <TableCell>
                  {editMode ? (
                    <TextField size="small" value={row.spec} onChange={e => handleCellChange(row.tempId, "spec", e.target.value)} />
                  ) : row.spec}
                </TableCell>

                <TableCell>
                  {editMode ? (
                    <TextField size="small" value={row.material} onChange={e => handleCellChange(row.tempId, "material", e.target.value)} />
                  ) : row.material}
                </TableCell>

                <TableCell>
                  {editMode ? (
                    <Select
                      size="small"
                      value={row.item_type}
                      onChange={e => handleCellChange(row.tempId, "item_type", e.target.value)}
                    >
                      <MenuItem value="PRODUCT">제품</MenuItem>
                      <MenuItem value="RAW">원자재</MenuItem>
                      <MenuItem value="SUB">부자재</MenuItem>
                      <MenuItem value="CONSUMABLE">소모자재</MenuItem>
                      <MenuItem value="TOOL">공구</MenuItem>
                    </Select>
                  ) : row.item_type}
                </TableCell>

                <TableCell>
                  {editMode ? (
                    <Select
                      size="small"
                      value={row.unit}
                      onChange={e => handleCellChange(row.tempId, "unit", e.target.value)}
                    >
                      <MenuItem value="EA">EA</MenuItem>
                      <MenuItem value="KG">KG</MenuItem>
                      <MenuItem value="SET">SET</MenuItem>
                    </Select>
                  ) : row.unit}
                </TableCell>

                <TableCell>{row.created_at}</TableCell>
                <TableCell>{row.updated_at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
