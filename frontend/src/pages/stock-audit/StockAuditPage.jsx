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
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { apiFetch } from "api/apiFetch";

export default function StockAuditListPage() {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);

  const [rows, setRows] = useState([]);

  useEffect(() => {
    apiFetch(`${import.meta.env.VITE_API_URL}/api/stock-audits`)
      .then(res => res.json())
      .then(data => {
        const converted = data.map(r => ({
          id: r.id,
          auditDate: r.audit_date,
          itemCount: r.item_count
        }));
        setRows(converted);
      })
      .catch(err => {
        console.error("재고실사 목록 조회 실패", err);
      });
  }, []);

  /* ===============================
     년 / 월 옵션 (데이터 기반)
  =============================== */

  const yearOptions = useMemo(() => {
    return Array.from(
      new Set(rows.map(r => dayjs(r.auditDate).year()))
    ).sort();
  }, [rows]);

  const [year, setYear] = useState("");


  const monthOptions = useMemo(() => {
    if (!year) return [];

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

    if (year && d.year() !== year) return false;
    if (month && d.month() + 1 !== month) return false;

    return true;
  });


  /* ===============================
     신규 실사 생성
  =============================== */

  const handleCreateAudit = async () => {
    const date = prompt("실사 날짜를 입력하세요 (YYYY-MM-DD)");
    if (!date) return;

    try {
      const res = await apiFetch(
        `${import.meta.env.VITE_API_URL}/api/stock-audits`,
        {
          method: "POST",
          body: JSON.stringify({
            audit_date: date
          })
        }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "생성 실패");
        return;
      }

      const created = await res.json();

      // ✅ DB에서 내려준 진짜 id 사용
      setRows(prev => [
        ...prev,
        {
          id: created.id,
          auditDate: created.audit_date,
          itemCount: created.item_count || 0
        }
      ]);

    } catch (e) {
      console.error(e);
      alert("재고실사 생성 중 오류 발생");
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        재고실사 관리
      </Typography>

      {/* 검색 조건 */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1
        }}
      >
        {/* 연도 */}
        <Select
          value={year}
          displayEmpty
          onChange={e => {
            setYear(e.target.value);
            setMonth("");   // 년도 바뀌면 월은 전체
          }}
          sx={{ minWidth: 120, fontWeight: "bold", fontSize: "15px" }}
        >
          <MenuItem value="">
            전체
          </MenuItem>

          {yearOptions.map(y => (
            <MenuItem key={y} value={y}>
              {y}년
            </MenuItem>
          ))}
        </Select>



        {/* 월 */}
        <Select
          value={month}
          displayEmpty
          onChange={e => setMonth(e.target.value)}
          sx={{ minWidth: 100, fontWeight: "bold", fontSize: "15px" }}
          disabled={editMode}
        >
          <MenuItem value="">전체</MenuItem>
          {monthOptions.map(m => (
            <MenuItem key={m} value={m}>
              {m}월
            </MenuItem>
          ))}
        </Select>


        {/* 가운데 밀기 */}
        <Box sx={{ flexGrow: 1 }} />

        {/* 조회 모드 */}
        {!editMode && (
          <Button
            variant="outlined"
            sx={{ fontWeight: "bold", fontSize: "15px" }}
            onClick={() => setEditMode(true)}
          >
            수정
          </Button>
        )}

        {/* 수정 모드 */}
        {editMode && (
          <>
            <Button
              variant="contained"
              sx={{ fontWeight: "bold", fontSize: "15px" }}
              onClick={handleCreateAudit}
            >
              + 신규 재고실사
            </Button>

            <Button
              variant="contained"
              color="success"
              sx={{ fontWeight: "bold", fontSize: "15px" }}
              onClick={() => {
                // TODO: 저장 API
                setEditMode(false);
              }}
            >
              저장
            </Button>

            <Button
              variant="outlined"
              color="error"
              sx={{ fontWeight: "bold", fontSize: "15px" }}
              onClick={() => {
                if (
                  window.confirm("저장하지 않고 수정모드를 종료하시겠습니까?")
                ) {
                  setEditMode(false);
                }
              }}
            >
              종료
            </Button>
          </>
        )}
      </Paper>



      {/* 목록 */}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>실사일자</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>품목 수</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>관리</TableCell>
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
                  <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{row.auditDate}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{row.itemCount}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                    <Button sx={{ fontWeight: "bold", fontSize: "15px" }}
                      size="small"
                      onClick={() =>
                        navigate(`/stock-audit/${row.id}`)
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
