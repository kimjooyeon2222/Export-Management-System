import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
} from "@mui/material";

export default function OilInvoiceTimeline({ invoiceInfo, items, onUpdateHeader,
  onUpdateSeq,editMode }) {
    function getUSToday() {
  const now = new Date();
  const us = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  return new Date(us.getFullYear(), us.getMonth(), us.getDate());
}


  // seq → qty 매핑
  const seqMap = useMemo(() => {
    const map = {};
    items.forEach((it) => {
      if (it.seq >= 1 && it.seq <= 38) {
        map[it.seq] = it.qty;
      }
    });
    return map;
  }, [items]);

  const isETAOverdue = new Date(invoiceInfo.eta) < new Date();

  return (
    <Box sx={{ mb: 4 }}>
      {/* 인보이스 번호 */}
      <Typography variant="h6" fontWeight="bold" mb={1}>
        {invoiceInfo.inv}
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#e8f5e9" }}>
              <TableCell align="center">INV#</TableCell>
              <TableCell align="center">PO#</TableCell>
              <TableCell align="center">ETD</TableCell>
              <TableCell align="center">ETA</TableCell>

              {Array.from({ length: 38 }).map((_, i) => (
                <TableCell key={i} align="center">
                  {i + 1}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            <TableRow>
              <TableCell  align="center">
  {editMode ? (
  <TextField
    size="small"
    value={invoiceInfo.inv || ""}
    onChange={(e) => onUpdateHeader("inv", e.target.value)}
  />
) : (
  invoiceInfo.inv || "-"
)}

</TableCell>

<TableCell align="center">
  {editMode ? (
  <TextField
    size="small"
    value={invoiceInfo.po || ""}
    onChange={(e) => onUpdateHeader("po", e.target.value)}
  />
) : (
  invoiceInfo.po || "-"
)}

</TableCell>

<TableCell align="center">
  {editMode ? (
  <TextField
    size="small"
    value={invoiceInfo.etd || ""}
    onChange={(e) => onUpdateHeader("etd", e.target.value)}
  />
) : (
  invoiceInfo.etd || "-"
)}

</TableCell>

<TableCell align="center"
  sx={{
    backgroundColor:
      invoiceInfo.eta &&
      new Date(invoiceInfo.eta) > getUSToday()
        ? "#ffe6eb" // 연한 핑크 배경
        : "inherit",
  }}
>
  {editMode ? (
    <TextField
      size="small"
      value={invoiceInfo.eta || ""}
      onChange={(e) => onUpdateHeader("eta", e.target.value)}
    />
  ) : (
    <span
      style={{
        color:
          invoiceInfo.eta &&
          new Date(invoiceInfo.eta) > getUSToday()
            ? "red"
            : "inherit",
        fontWeight:
          invoiceInfo.eta &&
          new Date(invoiceInfo.eta) > getUSToday()
            ? "bold"
            : "normal",
      }}
    >
      {invoiceInfo.eta || "-"}
    </span>
  )}
</TableCell>




              {/* 1~38번 seq 표시 */}
              {Array.from({ length: 38 }).map((_, i) => (
                <TableCell key={i} align="center" sx={{ backgroundColor: "#f1f8e9" }}>
                 {editMode ? (
  <TextField
    size="small"
    value={seqMap[i + 1] || ""}
    onChange={(e) => onUpdateSeq(i + 1, e.target.value)}
    sx={{ width: 45 }}
  />
) : (
  seqMap[i + 1] || "-"
)}


                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
