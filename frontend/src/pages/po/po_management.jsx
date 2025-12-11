// src/pages/po#/po_management.jsx
import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody,
  Paper
} from "@mui/material";

export default function POManagementPage() {
  const [poList, setPoList] = useState([]);
  const [poInput, setPoInput] = useState("");

  const addPO = () => {
    if (!poInput.trim()) return;
    const newPO = { id: Date.now(), po: poInput.trim() };
    setPoList(prev => [...prev, newPO]);
    setPoInput("");
  };

  const removePO = (id) => {
    setPoList(prev => prev.filter(item => item.id !== id));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        PO# 관리
      </Typography>

      {/* 입력 필드 */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="PO 번호 입력"
          value={poInput}
          onChange={(e) => setPoInput(e.target.value)}
          size="small"
        />
        <Button
          variant="contained"
          onClick={addPO}
          sx={{ bgcolor: "#1976d2" }}
        >
          추가
        </Button>
      </Box>

      {/* 리스트 테이블 */}
      <Paper sx={{ width: 400 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>PO 번호</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 80 }}>삭제</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {poList.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.po}</TableCell>
                <TableCell>
                  <Button
                    color="error"
                    onClick={() => removePO(item.id)}
                  >
                    삭제
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {poList.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ py: 3, color: "#777" }}>
                  등록된 PO가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
