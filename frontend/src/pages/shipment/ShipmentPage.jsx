import React, { useState, useMemo, useEffect } from "react";
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
  Paper,
  Select,
  MenuItem
} from "@mui/material";

/* ============================
   항목 정의
============================ */
const DOMESTIC_ITEMS = [
  "터미널 핸들링비(THC)",
  "부두사용료(WFG)",
  "부두보안료(FPS)",
  "씰 자물쇠 고정장치(SEAL CHG)",
  "서류비(DOC)",
  "부대 내 컨테이너 적재비(CFS CHG)",
  "바인딩 비용(SHORING CHG)",
  "AMS 전송료",
  "통관료",
  "보험료"
];

const US_ITEMS = ["미국 운송료", "통관료", "ISF파일"];

export default function ShipmentPage() {
  const [editMode, setEditMode] = useState(false);
  const [route, setRoute] = useState("SAVANNAH");
  const [month, setMonth] = useState(12);
  const [exchangeRate, setExchangeRate] = useState(1470);
  const [usDate, setUsDate] = useState("2025-12-01");

  /* 날짜 ↔ 월 연동 */
  useEffect(() => {
    if (!usDate) return;
    const [, m] = usDate.split("-");
    setMonth(Number(m));
  }, [usDate]);

  const yearLabel = `'${usDate?.slice(2, 4)}년도`;

  const [domestic, setDomestic] = useState(
    DOMESTIC_ITEMS.map(name => ({ name, qty: 1, v20: 0, v40: 0 }))
  );
  const [ocean, setOcean] = useState({ qty: 1, v20: 2900, v40: 3500 });
  const [usCosts, setUsCosts] = useState(
    US_ITEMS.map(name => ({ name, qty: 1, v20: 0, v40: 0 }))
  );

  /* ============================
     계산
  ============================ */
  const sumSection = rows =>
    rows.reduce(
      (acc, r) => {
        acc.v20 += r.qty * Number(r.v20 || 0);
        acc.v40 += r.qty * Number(r.v40 || 0);
        return acc;
      },
      { v20: 0, v40: 0 }
    );

  const domesticSum = useMemo(() => sumSection(domestic), [domestic]);
  const oceanSum = useMemo(
    () => ({
      v20: ocean.qty * ocean.v20 * exchangeRate,
      v40: ocean.qty * ocean.v40 * exchangeRate
    }),
    [ocean, exchangeRate]
  );
  const usSum = useMemo(() => sumSection(usCosts), [usCosts]);

  const total20 = domesticSum.v20 + oceanSum.v20 + usSum.v20;
  const total40 = domesticSum.v40 + oceanSum.v40 + usSum.v40;

  const renderValue = (value, onChange) =>
    editMode ? (
      <TextField size="small" value={value} onChange={onChange} />
    ) : (
      value.toLocaleString()
    );

  const subtotalCell = { bgcolor: "#fff3cd" };
  const groupCellStyle = {
    borderBottom: "3px solid #c5c5c5",
    verticalAlign: "middle"
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 제목 */}
      <Typography fontWeight="bold" fontSize={22} mb={1}>
        {yearLabel} {month}월 신화USA 수출 해상운임비용
      </Typography>

      {/* 북미 기준 날짜 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <TextField
          label="북미 기준 날짜"
          size="small"
          value={usDate}
          onChange={e => editMode && setUsDate(e.target.value)}
          InputProps={{ readOnly: !editMode }}
          sx={{ width: 220 }}
        />
      </Box>

      {/* 버튼 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 2 }}>
        <Button variant="outlined" onClick={() => setEditMode(p => !p)}>
          {editMode ? "수정모드 종료" : "수정모드 활성화"}
        </Button>
        <Button variant="contained" disabled={!editMode}>
          저장
        </Button>
      </Box>

      {/* 조건 */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Select value={route} onChange={e => setRoute(e.target.value)}>
          <MenuItem value="SAVANNAH">BUSAN → SAVANNAH</MenuItem>
          <MenuItem value="MOBILE">BUSAN → MOBILE</MenuItem>
          <MenuItem value="LA">BUSAN → LA</MenuItem>
        </Select>

        <Typography fontWeight="bold">월</Typography>
        {month}

        <Typography fontWeight="bold">환율</Typography>
        {renderValue(exchangeRate, e => setExchangeRate(e.target.value))}
      </Box>

      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#e6f3ff" }}>
            <TableRow>
              {["구분", "내역", "수량", "20FT", "40HQ"].map(h => (
                <TableCell key={h} align="center" sx={{ fontWeight: "bold" }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody sx={{ "& td": { fontWeight: "bold" } }}>
            {/* ================= 국내비용 ================= */}
            {domestic.map((r, i) => (
              <TableRow key={r.name}>
                {i === 0 && (
                  <TableCell rowSpan={domestic.length + 1} align="center" sx={groupCellStyle}>
                    국내비용
                  </TableCell>
                )}
                <TableCell align="center">{r.name}</TableCell>
                <TableCell align="center">{r.qty}</TableCell>
                <TableCell align="center">{renderValue(r.v20, e => {
                  const v=[...domestic]; v[i].v20=e.target.value; setDomestic(v);
                })}</TableCell>
                <TableCell align="center">{renderValue(r.v40, e => {
                  const v=[...domestic]; v[i].v40=e.target.value; setDomestic(v);
                })}</TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell align="center" sx={subtotalCell}>소 계</TableCell>
              <TableCell sx={subtotalCell} />
              <TableCell align="center" sx={subtotalCell}>{domesticSum.v20.toLocaleString()}</TableCell>
              <TableCell align="center" sx={subtotalCell}>{domesticSum.v40.toLocaleString()}</TableCell>
            </TableRow>

            {/* ================= 해상운임 (소계 포함) ================= */}
            <TableRow>
              <TableCell rowSpan={2} align="center" sx={groupCellStyle}>
                해상운임
              </TableCell>
              <TableCell align="center">BUSAN → MOBILE</TableCell>
              <TableCell align="center">{ocean.qty}</TableCell>
              <TableCell align="center">{renderValue(ocean.v20, e => setOcean({ ...ocean, v20: e.target.value }))}</TableCell>
              <TableCell align="center">{renderValue(ocean.v40, e => setOcean({ ...ocean, v40: e.target.value }))}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell align="center" sx={subtotalCell}>소 계</TableCell>
              <TableCell sx={subtotalCell} />
              <TableCell align="center" sx={subtotalCell}>{oceanSum.v20.toLocaleString()}</TableCell>
              <TableCell align="center" sx={subtotalCell}>{oceanSum.v40.toLocaleString()}</TableCell>
            </TableRow>

            {/* ================= 미국비용 ================= */}
            {usCosts.map((r, i) => (
              <TableRow key={r.name}>
                {i === 0 && (
                  <TableCell rowSpan={usCosts.length + 1} align="center" sx={groupCellStyle}>
                    미국비용
                  </TableCell>
                )}
                <TableCell align="center">{r.name}</TableCell>
                <TableCell align="center">{r.qty}</TableCell>
                <TableCell align="center">{renderValue(r.v20, e => {
                  const v=[...usCosts]; v[i].v20=e.target.value; setUsCosts(v);
                })}</TableCell>
                <TableCell align="center">{renderValue(r.v40, e => {
                  const v=[...usCosts]; v[i].v40=e.target.value; setUsCosts(v);
                })}</TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell align="center" sx={subtotalCell}>소 계</TableCell>
              <TableCell sx={subtotalCell} />
              <TableCell align="center" sx={subtotalCell}>{usSum.v20.toLocaleString()}</TableCell>
              <TableCell align="center" sx={subtotalCell}>{usSum.v40.toLocaleString()}</TableCell>
            </TableRow>

            {/* ================= 합계 ================= */}
            <TableRow sx={{ bgcolor: "#d1e7dd" }}>
              <TableCell />
              <TableCell align="center">합 계</TableCell>
              <TableCell />
              <TableCell align="center">{total20.toLocaleString()}</TableCell>
              <TableCell align="center">{total40.toLocaleString()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
