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

const toMidnight = (date, timeZone = "America/Chicago") => {
  const local = new Date(date).toLocaleString("en-US", { timeZone });
  const d = new Date(local);
  d.setHours(0, 0, 0, 0);
  return d;
};
const todayUS = toMidnight(new Date(), "America/Chicago");



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
            toMidnight(normalizeDate(invoiceInfo.eta), "America/Chicago") >= todayUS
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
                toMidnight(normalizeDate(invoiceInfo.eta), "America/Chicago") >= todayUS

                  ? "red"
                  : "inherit",
              fontWeight:
                invoiceInfo.eta &&
                toMidnight(normalizeDate(invoiceInfo.eta), "America/Chicago") >= todayUS

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
