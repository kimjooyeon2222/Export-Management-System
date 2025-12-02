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
} from "@mui/material";

export default function OilInvoiceTimeline({ invoiceInfo, items }) {
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
              <TableCell>INV#</TableCell>
              <TableCell>PO#</TableCell>
              <TableCell>ETD</TableCell>
              <TableCell>ETA</TableCell>

              {Array.from({ length: 38 }).map((_, i) => (
                <TableCell key={i} align="center">
                  {i + 1}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            <TableRow>
              <TableCell>{invoiceInfo.inv}</TableCell>
              <TableCell>{invoiceInfo.po}</TableCell>
              <TableCell>{invoiceInfo.etd}</TableCell>

              {/* ETA → 지났으면 빨간색 */}
              <TableCell
                sx={{
                  fontWeight: isETAOverdue ? "bold" : "normal",
                  color: isETAOverdue ? "red" : "inherit",
                }}
              >
                {invoiceInfo.eta}
              </TableCell>

              {/* 1~38번 seq 표시 */}
              {Array.from({ length: 38 }).map((_, i) => (
                <TableCell key={i} align="center" sx={{ backgroundColor: "#f1f8e9" }}>
                  {seqMap[i + 1] || "-"}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
