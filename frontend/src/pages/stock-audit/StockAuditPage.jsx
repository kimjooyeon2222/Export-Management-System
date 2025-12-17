// frontend/src/pages/stock-audit/StockAuditListPage.jsx
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem
} from "@mui/material";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

export default function StockAuditListPage() {
  const navigate = useNavigate();

  // 🔥 임시 데이터 (나중에 API로 교체)
  const [rows, setRows] = useState([
    { id: 1, auditDate: "2025-11-03", itemCount: 42 },
    { id: 2, auditDate: "2025-12-01", itemCount: 38 }
  ]);

  /* ===============================
     년 / 월 옵션 (데이터 기반)
  =============================== */

  const yearOptions = useMemo(() => {
    return Array.from(
      new Set(rows.map(r => dayjs(r.auditDate).year()))
    ).sort();
  }, [rows]);

  const [year, setYear] = useState(
    yearOptions.length ? yearOptions[0] : dayjs().year()
  );

  const monthOptions = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .filter(r => dayjs(r.auditDate).year() === year)
          .map(r => dayjs(r.auditDate).month() + 1)
      )
    ).sort();
  }, [rows, year]);

 const [month, setMonth] = useState("");


  /* ===============================
     필터링된 목록
  =============================== */

  const filteredRows = rows.filter(r => {
    const d = dayjs(r.auditDate);
    return (
  d.year() === year &&
  (month ? d.month() + 1 === month : true)
);
  });

  /* ===============================
     신규 실사 생성
  =============================== */

  const handleCreateAudit = () => {
    const date = prompt("실사 날짜를 입력하세요 (YYYY-MM-DD)");
    if (!date) return;

    const exists = rows.find(r => r.auditDate === date);
    if (exists) {
      alert("이미 존재하는 재고실사 날짜입니다.");
      return;
    }

    setRows(prev => [
      ...prev,
      {
        id: Date.now(),
        auditDate: date,
        itemCount: 0
      }
    ]);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        재고실사 관리
      </Typography>

      {/* 검색 조건 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Select 
          value={year}
          onChange={e => {
            setYear(e.target.value);
            setMonth(""); // 연도 바뀌면 월 초기화
          }}
          sx={{ mr: 2, minWidth: 120 ,fontWeight:"bold", fontSize:"15px"}}
        >
          {yearOptions.map(y => (
            <MenuItem key={y} value={y}> 
              {y}년
            </MenuItem>
          ))}
        </Select>

        <Select
  value={month}
  displayEmpty
  onChange={e => setMonth(e.target.value)}
  sx={{ minWidth: 100,fontWeight:"bold", fontSize:"15px" }}
>
  <MenuItem value="">전체</MenuItem>
  {monthOptions.map(m => (
    <MenuItem key={m} value={m}>
      {m}월
    </MenuItem>
  ))}
</Select>



        <Button
          variant="contained"
          sx={{ ml: 2,fontWeight:"bold", fontSize:"15px" }}
          onClick={handleCreateAudit}
        >
          + 신규 재고실사
        </Button>
      </Paper>

      {/* 목록 */}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>실사일자</TableCell>
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>품목 수</TableCell>
              <TableCell align="center" sx={{fontWeight:"bold", fontSize:"15px"}}>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  해당 월의 재고실사 데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map(row => (
                <TableRow key={row.id}>
                  <TableCell align="center"  sx={{fontWeight:"bold", fontSize:"15px"}}>{row.auditDate}</TableCell>
                  <TableCell align="center"  sx={{fontWeight:"bold", fontSize:"15px"}}>{row.itemCount}</TableCell>
                  <TableCell align="center"  sx={{fontWeight:"bold", fontSize:"15px"}}>
                    <Button  sx={{fontWeight:"bold", fontSize:"15px"}}
                      size="small"
                      onClick={() =>
                        navigate(`/stock-audit/${row.auditDate}`)
                      }
                    >
                      열기
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
