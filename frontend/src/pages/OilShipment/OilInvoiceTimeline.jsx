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
  /* ----------------------------------
        🔹 한국 / 미국 날짜 변환 함수
  ---------------------------------- */
  function parseKRDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, -9, 0, 0));  // 한국 00시 고정
}



  function parseUSDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 6, 0, 0)); // 미국 00:00
  }

  /* ----------------------------------
        🔹 문자열 → YYYY-MM-DD 변환
  ---------------------------------- */
  const normalizeDate = (str) => {
    if (!str) return null;

    if (!isNaN(Date.parse(str))) return str;

    const match = str.match(/(\d{1,2})월\s*(\d{1,2})일/);
    if (!match) return null;

    const month = match[1].padStart(2, "0");
    const day = match[2].padStart(2, "0");

    const year = new Date().getFullYear();
    return `${year}-${month}-${day}`;
  };

  /* ----------------------------------
        🔹 미국 기준 오늘 00:00
  ---------------------------------- */
  function todayUS() {
    const nowUS = new Date().toLocaleString("en-US", {
      timeZone: "America/Chicago",
    });
    const d = new Date(nowUS);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const today = todayUS();


  /* ----------------------------------
        🔹 ETA 비교용 날짜 생성
  ---------------------------------- */
  const etaDate = invoiceInfo.eta
    ? parseUSDate(normalizeDate(invoiceInfo.eta))
    : null;

  // ETA가 미국 날짜(today)보다 미래면 빨간색 + 배경색
  const isIncoming = etaDate && etaDate > today;


  /* ----------------------------------
        🔹 seq → qty 매핑
  ---------------------------------- */
  const seqMap = useMemo(() => {
    const map = {};
    items.forEach((it) => {
      map[it.seq] = it.qty;
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
      {/* PO */}
<TableCell align="center">
  {editMode ? (
    <TextField
      size="small"
      multiline
      value={
        Array.isArray(invoiceInfo.po)
          ? invoiceInfo.po.join("\n")      // 배열 → 개행 문자열
          : invoiceInfo.po || ""
      }
      onChange={(e) =>
        onUpdateHeader("po", e.target.value)
      }
    />
  ) : (
    <span style={{ whiteSpace: "pre-line" }}>
      {Array.isArray(invoiceInfo.po)
        ? invoiceInfo.po.join("\n")        // 배열 → 개행 문자열
        : (invoiceInfo.po || "-").split(",").join("\n")
}
    </span>
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
<TableCell align="center">
  {editMode ? (
    <TextField
      size="small"
      value={invoiceInfo.eta || ""}
      onChange={(e) => onUpdateHeader("eta", e.target.value)}
    />
  ) : (
    <span
      style={{
        display: "inline-block",                 
        backgroundColor: isIncoming ? "#ffe6eb" : "transparent",
        borderRadius: "999px",
        padding: isIncoming ? "2px 8px" : 0,    
        color: isIncoming ? "red" : "inherit",
        fontWeight: isIncoming ? "bold" : "normal",
      }}
    >
      {invoiceInfo.eta || "-"}
    </span>
  )}
</TableCell>

      {/* Calendar seq cells */}
      {calendarDays.map((day) => (
        <TableCell key={day} align="center" sx={{ backgroundColor: "#f1f8e9" }}>
          {editMode ? (
            <TextField
              size="small"
              value={seqMap[day] || ""}
              onChange={(e) => onUpdateSeq(invoiceInfo.inv, day, e.target.value)}
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
