import React, { useMemo } from "react";
import { TableRow, TableCell, TextField } from "@mui/material";

export default function OilInvoiceTimeline({
  invoiceInfo,
  items,
  onUpdateHeader,
  onUpdateSeq,
  editMode,
  calendarDays
}) {

  function getUSToday() {
    const now = new Date();
    const us = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Chicago" })
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

  return (
    <TableRow>
      {/* INV */}
      <TableCell align="center">
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

      {/* PO */}
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

      {/* ETD */}
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

      {/* ETA */}
      <TableCell
        align="center"
        sx={{
          backgroundColor:
            invoiceInfo.eta &&
            new Date(invoiceInfo.eta) > getUSToday()
              ? "#ffe6eb"
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

      {calendarDays.map(day => (
  <TableCell key={day} align="center" sx={{ backgroundColor: "#f1f8e9" }}>
    {editMode ? (
      <TextField
        size="small"
        value={seqMap[day] || ""}
        onChange={(e) => onUpdateSeq(day, e.target.value)}
        sx={{ width: 45 }}
      />
    ) : (
      seqMap[day] || "-"
    )}
  </TableCell>
))}

    </TableRow>
  );
}
