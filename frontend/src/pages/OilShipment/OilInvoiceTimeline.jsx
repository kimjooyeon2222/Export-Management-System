import React, { useMemo } from "react";
import { TableRow, TableCell, TextField } from "@mui/material";

export default function OilInvoiceTimeline(   
    {
  invoiceInfo,
  items,
  onUpdateHeader,
  onUpdateSeq,
  editMode,
  calendarDays
}) {

    
function toMidnightUS(dateStr) {
  if (!dateStr) return null;

  const [year, month, day] = dateStr.split("-").map(Number);

  // 먼저 해당 날짜의 UTC timestamp 생성
  const utc = Date.UTC(year, month - 1, day, 0, 0, 0);

  // 그 날짜의 Chicago offset 가져오기
  const offsetHours = getChicagoOffset(new Date(utc));

  // offset을 반영해 미국 시간 timestamp 생성
  const chicagoTimestamp = utc - offsetHours * 3600 * 1000;

  return new Date(chicagoTimestamp);
}


function getChicagoOffset(date) {
  // date 기준 Chicago offset (DST 대응)
  const options = { timeZone: "America/Chicago", timeZoneName: "short" };
  const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(date);
  const zoneName = parts.find(p => p.type === "timeZoneName").value;

  // CST → UTC-6, CDT → UTC-5
  return zoneName === "CDT" ? -5 : -6;
}
function getUSToday() {
  const now = new Date();

  // 지금 시점의 Chicago 날짜를 얻기 위한 offset 계산
  const offsetHours = getChicagoOffset(now);

  // 지금 시간 기준 UTC timestamp
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;

  // 미국 날짜 timestamp
  const chicagoTimestamp = utc - offsetHours * 3600 * 1000;

  const chicagoDate = new Date(chicagoTimestamp);
  chicagoDate.setHours(0, 0, 0, 0);

  return chicagoDate;
}


  // seq → qty 매핑
  const seqMap = useMemo(() => {
  const map = {};
  items.forEach((it) => {
    // 🔥 모든 seq 처리 (1 ~ oilList.length)
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
            toMidnightUS(invoiceInfo.eta) > getUSToday()
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
                toMidnightUS(invoiceInfo.eta) > getUSToday()
                  ? "red"
                  : "inherit",
              fontWeight:
                invoiceInfo.eta &&
                toMidnightUS(invoiceInfo.eta) > getUSToday()
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
