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
import ItemKindPicker, { ITEM_KIND_LIST } from "components/ItemKindPicker";

export const ITEM_FORM_MAP = {
  "1": "제품",
  "2": "반제품",
  "3": "원자재",
  "4": "부자재",
  "5": "소모자재",
  "6": "경비(임가공비)",   
  "7": "무상사급품",
  "8": "가상품",          
  "9": "관리품",
  "A": "식자재"
};

export default function ItemPage() {
  
 const [openKindPicker, setOpenKindPicker] = useState(null);

const ITEM_KIND_MAP = Object.fromEntries(
  ITEM_KIND_LIST.map(v => [v.code, v.name])
);


const handleSave = async () => {
  const API = import.meta.env.VITE_API_URL;

  // ⭐ 핵심: 신규 + 수정된 것만
 const targets = rows.filter(row =>
  (row._deleted && row.id) ||   // 기존 데이터 삭제
  (!row.id && !row._deleted) || // 신규 등록
  row._dirty                    // 수정
);

  if (targets.length === 0) {
    alert("저장할 변경사항이 없습니다.");
    return;
  }

  if (!window.confirm(`${targets.length}건을 저장할까요?`)) return;

for (const row of targets) {
  if (row._deleted && row.id) {
    await apiFetch(`${API}/api/items/${row.id}`, {
      method: "DELETE"
    });
    continue;
  }

  const payload = {
    item_no: row.item_no,
    item_name: row.item_name,
    company_name: row.company_name,
    spec: row.spec,
    material: row.material,
    item_form: row.item_form,   
    item_kind: row.item_kind, 
    unit: row.unit
  };

  if (!row.id) {
    await apiFetch(`${API}/api/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } else if (row._dirty) {
    await apiFetch(`${API}/api/items/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }
}


  alert("✅ 저장 완료");

  handleSearch();
};


    useEffect(() => {
  handleSearch();
}, []);
  /* ===================== 상태 ===================== */
  const [rows, setRows] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editSelectMode, setEditSelectMode] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const [search, setSearch] = useState({
    itemNo: "",
    itemName: "",
    companyName:"",
    spec: "",
    material: "",
    itemForm: "",
    itemKind: "",
    unit: "",
    orderBy: "itemNo",
    limit: 100
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
        company_name: "",   
        spec: "",
        material: "",
        item_form: "",  
        item_kind: "",   
        unit: "EA",
        created_at: "",
        updated_at: ""
      }
    ]);
    alert("✅ 품목 행 추가 완료");
  };

  const toggleDeleteMode = () => {
  if (!editMode) return;

  // 🔁 삭제 모드 OFF (다시 누르면 취소)
  if (deleteMode && selectedRows.length === 0) {
    setDeleteMode(false);
    setSelectedRows([]);
    return;
  }

  // 🔁 삭제 모드 ON
  if (!deleteMode) {
    setDeleteMode(true);
    setSelectedRows([]);
    alert("🗑 삭제 모드 활성화\n삭제할 품목을 선택하세요.");
    return;
  }

  // 🔥 삭제 실행
  if (!window.confirm(`${selectedRows.length}개 품목을 삭제할까요? \n이후 저장 버튼 눌러주셔야 반영됩니다.`)) return;

  setRows(prev =>
  prev.map(r =>
    selectedRows.includes(r.tempId)
      ? { ...r, _deleted: true }
      : r
  )
);

  setSelectedRows([]);
  setDeleteMode(false);
};


  const handleCellChange = (id, field, value) => {
  if (!editMode || !editSelectMode || deleteMode) return;

  setRows(prev =>
    prev.map(row =>
      row.tempId === id
        ? { ...row, [field]: value, _dirty: true }
        : row
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
  color={editSelectMode ? "info" : "secondary"}
  disabled={!editMode}
  onClick={() => {
    setEditSelectMode(prev => !prev);
    setDeleteMode(false);
    setSelectedRows([]);
    setEditingRowId(null);

    if (!editSelectMode) {
      alert("✏ 수정할 행을 클릭하세요.");
    }
  }}
>
  {editSelectMode ? "수정 취소" : "수정"}
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
  variant="contained"
  color="success"
  disabled={!editMode}
  onClick={handleSave}
>
  저장
</Button>

        <Button
          variant="outlined"
          onClick={() => {
            setEditMode(prev => !prev);
            setDeleteMode(false);
            setSelectedRows([]);
            setEditingRowId(null); 

          }}
          sx={{ fontWeight: "bold" }}
        >
          {editMode ? "수정모드 종료" : "수정모드 활성화"}
        </Button>
      </Box>

      {/* ================= 검색 영역 ================= */}
      <Paper   component="form" sx={{ p: 2, mb: 2 }} onSubmit={(e) => {e.preventDefault(); handleSearch(); }}>
         <Grid container spacing={2} justifyContent="center">
          <Grid item xs={3}>
            <TextField label="품목번호" name="itemNo" fullWidth value={search.itemNo} onChange={handleSearchChange} />
          </Grid>
          <Grid item xs={3}>
            <TextField label="품목명" name="itemName" fullWidth value={search.itemName} onChange={handleSearchChange} />
          </Grid>
          <Grid item xs={3}>
            <TextField label="업체명" name="companyName" fullWidth value={search.companyName} onChange={handleSearchChange} />
          </Grid>
          <Grid item xs={3}>
            <TextField label="규격" name="spec" fullWidth value={search.spec} onChange={handleSearchChange} />
          </Grid>
          <Grid item xs={3}>
            <TextField label="재질" name="material" fullWidth value={search.material} onChange={handleSearchChange} />
          </Grid>

          <Grid item xs={3}>
            <Select fullWidth name="itemForm" value={search.itemForm} onChange={handleSearchChange} displayEmpty>
                <MenuItem value="">품목형태(전체)</MenuItem>
                <MenuItem value="1">제품</MenuItem>
                <MenuItem value="2">반제품</MenuItem>
                <MenuItem value="3">원자재</MenuItem>
                <MenuItem value="4">부자재</MenuItem>
                <MenuItem value="5">소모자재</MenuItem>
                <MenuItem value="6">경비(임가공비)</MenuItem>
                <MenuItem value="7">무상사급품</MenuItem>
                <MenuItem value="8">가상품</MenuItem>
                <MenuItem value="9">관리품</MenuItem>
                <MenuItem value="A">식자재</MenuItem>
            </Select>
          </Grid>
<Grid item xs={3}>
  <Box>
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>

  <TextField
    label="품목유형"
    fullWidth
    value={ITEM_KIND_MAP[search.itemKind] || ""}
    placeholder="전체"
    InputProps={{ readOnly: true }}
    onClick={() => setOpenKindPicker(true)}
    sx={{
      cursor: "pointer",
      "& .MuiInputBase-input": {
        cursor: "pointer"
      }
    }}
  />

 
  </Box>
</Box>

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
              <MenuItem value="created_at_desc">등록일시 역순</MenuItem> 

            </Select>
          </Grid>

          <Grid item xs={3}>
            <TextField label="최대검색수" name="limit" type="number" fullWidth value={search.limit} onChange={handleSearchChange} />
          </Grid>

          <Grid item xs={12} textAlign="right">
            <Button variant="contained" type="submit">
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
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize:"15px" }}>품목번호</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize:"15px"  }}>품목명</TableCell>
             <TableCell align="center"  sx={{ fontWeight: "bold", fontSize:"15px"  }}>업체명</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize:"15px"  }}>규격</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" , fontSize:"15px" }}>재질</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize:"15px"  }}>품목형태</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize:"15px"  }}>품목유형</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" , fontSize:"15px" }}>단위</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" , fontSize:"15px" }}>등록일시</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize:"15px"  }}>수정일시</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  조회된 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}

            {rows
            .filter(row => !row._deleted)
            .map(row => (
              <TableRow 
  key={row.tempId}
  hover
  sx={{
    cursor: deleteMode || editSelectMode ? "pointer" : "default",
    bgcolor:
      deleteMode && selectedRows.includes(row.tempId)
        ? "#ffdddd"
        : editSelectMode && editingRowId === row.tempId
        ? "#e3f2fd"   // ✨ 수정 선택 행 표시
        : "inherit"
  }}
  onClick={() => {
    // 🗑 삭제 모드
    if (deleteMode) {
      setSelectedRows(prev =>
        prev.includes(row.tempId)
          ? prev.filter(id => id !== row.tempId)
          : [...prev, row.tempId]
      );
      return;
    }

    // ✏ 수정 선택 모드
    if (editSelectMode) {
      setEditingRowId(row.tempId);
    }
  }}
>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize:"15px"  }}>
                  {editMode && editingRowId === row.tempId ? (
  <TextField
    size="small"
    value={row.item_no}
    onChange={e =>
      handleCellChange(row.tempId, "item_no", e.target.value)
    }
  />
) : (
  row.item_no
)}

                </TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold" , fontSize:"15px" }}>
                  {editMode && editingRowId === row.tempId ? (
  <TextField
    size="small"
    value={row.item_name}
    onChange={e =>
      handleCellChange(row.tempId, "item_name", e.target.value)
    }
  />
) : (
  row.item_name
)}

                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
  {editMode && editingRowId === row.tempId ? (
    <TextField
      size="small"
      value={row.company_name || ""}
      onChange={e =>
        handleCellChange(row.tempId, "company_name", e.target.value)
      }
    />
  ) : (
    row.company_name
  )}
</TableCell>


                <TableCell align="center" sx={{ fontWeight: "bold", fontSize:"15px"  }}>
  {editMode && editingRowId === row.tempId ? (
    <TextField
      size="small"
      value={row.spec}
      onChange={e =>
        handleCellChange(row.tempId, "spec", e.target.value)
      }
    />
  ) : (
    row.spec
  )}
</TableCell>


                <TableCell align="center" sx={{ fontWeight: "bold", fontSize:"15px"  }}>
  {editMode && editingRowId === row.tempId ? (
    <TextField
      size="small"
      value={row.material}
      onChange={e =>
        handleCellChange(row.tempId, "material", e.target.value)
      }
    />
  ) : (
    row.material
  )}
</TableCell>


                <TableCell align="center"   sx={{ fontWeight: "bold", fontSize:"15px"  }}>
  {editMode && editingRowId === row.tempId ? (
    <Select
  size="small"
  value={row.item_form ?? ""}
  onChange={e =>
    handleCellChange(row.tempId, "item_form", e.target.value)
  }
>
  <MenuItem value="1">제품</MenuItem>
  <MenuItem value="2">반제품</MenuItem>
  <MenuItem value="3">원자재</MenuItem>
  <MenuItem value="4">부자재</MenuItem>
  <MenuItem value="5">소모자재</MenuItem>
  <MenuItem value="6">경비(임가공비)</MenuItem>
  <MenuItem value="7">무상사급품</MenuItem>
  <MenuItem value="8">가상품</MenuItem>
  <MenuItem value="9">관리품</MenuItem>
  <MenuItem value="A">식자재</MenuItem>
</Select>

  ) : (
    ITEM_FORM_MAP[row.item_form] || row.item_form
  )}
</TableCell>
<TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
  {editMode && editingRowId === row.tempId ? (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <TextField
        size="small"
        value={ITEM_KIND_MAP[row.item_kind] || ""}
        InputProps={{ readOnly: true }}
        onClick={() => {
          setOpenKindPicker(row.tempId); // 어떤 행인지 저장
        }}
        sx={{
          cursor: "pointer",
          "& .MuiInputBase-input": { cursor: "pointer" }
        }}
      />
    </Box>
  ) : (
    ITEM_KIND_MAP[row.item_kind] || row.item_kind
  )}
</TableCell>



                <TableCell align="center"  sx={{ fontWeight: "bold", fontSize:"15px"  }}>
  {editMode && editingRowId === row.tempId ? (
  row.unit === "__custom__" ? (
    <TextField
      size="small"
      autoFocus
      onBlur={(e) =>
        handleCellChange(row.tempId, "unit", e.target.value || "EA")
      }
    />
  ) : (
    <Select
      size="small"
      value={row.unit}
      onChange={(e) => {
        if (e.target.value === "직접입력") {
          handleCellChange(row.tempId, "unit", "__custom__");
        } else {
          handleCellChange(row.tempId, "unit", e.target.value);
        }
      }}
    >
      {["EA","KG","SET","BOX","RL","벌","통","리터","직접입력"].map(u => (
        <MenuItem key={u} value={u}>{u}</MenuItem>
      ))}
    </Select>
  )
) : (
  row.unit
)}
</TableCell>


                <TableCell align="center"   sx={{ fontWeight: "bold", fontSize:"15px"  }}>{row.created_at}</TableCell>
                <TableCell align="center"  sx={{ fontWeight: "bold", fontSize:"15px"  }}>{row.updated_at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
        <ItemKindPicker
  open={Boolean(openKindPicker)}
  onClose={() => setOpenKindPicker(null)}
  onSelect={(selected) => {
    handleCellChange(openKindPicker, "item_kind", selected.code);
    setOpenKindPicker(null);
  }}
/>


    </Box>
    
  );

}
