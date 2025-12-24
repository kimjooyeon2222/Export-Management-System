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
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { apiFetch } from "api/apiFetch";

export default function ForgingListPage() {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL;

  const [rows, setRows] = useState([]);
  const [editMode, setEditMode] = useState(false);

  /* ===============================
     🔹 목록 조회
  =============================== */
  useEffect(() => {
    apiFetch(`${API_BASE}/api/forging-audits`)
      .then(res => res.json())
      .then(data => {
        setRows(data);
      })
      .catch(err => {
        console.error("forging audit list load error", err);
      });
  }, []);

  /* ===============================
     🔹 연 / 월 필터
  =============================== */
  const yearOptions = useMemo(() => {
    return Array.from(
      new Set(rows.map(r => r.audit_year))
    ).sort();
  }, [rows]);

  const [year, setYear] = useState("");

  const monthOptions = useMemo(() => {
    if (!year) return [];
    return Array.from(
      new Set(
        rows
          .filter(r => r.audit_year === year)
          .map(r => r.audit_month)
      )
    ).sort();
  }, [rows, year]);

  const [month, setMonth] = useState("");

  const filteredRows = rows.filter(r => {
    if (year && r.audit_year !== year) return false;
    if (month && r.audit_month !== month) return false;
    return true;
  });

  /* ===============================
     🔹 신규 Forging 실사 생성
  =============================== */
  const handleCreate = async () => {
    const date = prompt("Forging 실사 날짜 입력 (YYYY-MM-DD)");
    if (!date) return;

    try {
      const res = await apiFetch(`${API_BASE}/api/forging-audits`, {
        method: "POST",
        body: JSON.stringify({ audit_date: date })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "생성 실패");
        return;
      }

      const created = await res.json();
      setRows(prev => [...prev, created]);

    } catch (e) {
      console.error(e);
      alert("생성 중 오류 발생");
    }
  };

  /* ===============================
     🔹 삭제
  =============================== */
  const handleDelete = async (id) => {
    if (!window.confirm("해당 Forging 실사를 삭제하시겠습니까?")) return;

    try {
      const res = await apiFetch(`${API_BASE}/api/forging-audits/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        alert("삭제 실패");
        return;
      }

      setRows(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error(e);
      alert("삭제 오류");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* ← 메인으로 버튼 */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          onClick={() => navigate("/")}
          sx={{
            borderColor: "#0069a6ff",
            color: "#0056a6ff",
            backgroundColor: "#ffffff",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "#ecfeffff",
              borderColor: "#0069a6ff",
              color: "#0085a6ff",
            },
          }}
        >
          ← 메인으로
        </Button>
      </Box>
      <Typography variant="h4" gutterBottom>
        Forging 실사 관리
      </Typography>

      {/* ===============================
          🔹 검색 / 제어 영역
      =============================== */}
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
            setMonth("");
          }}
          sx={{ minWidth: 120, fontWeight: "bold" }}
        >
          <MenuItem value="">전체</MenuItem>
          {yearOptions.map(y => (
            <MenuItem key={y} value={y}>{y}년</MenuItem>
          ))}
        </Select>

        {/* 월 */}
        <Select
          value={month}
          displayEmpty
          onChange={e => setMonth(e.target.value)}
          sx={{ minWidth: 100, fontWeight: "bold" }}
        >
          <MenuItem value="">전체</MenuItem>
          {monthOptions.map(m => (
            <MenuItem key={m} value={m}>{m}월</MenuItem>
          ))}
        </Select>

        <Box sx={{ flexGrow: 1 }} />

        {!editMode && (
          <Button sx={{ fontWeight: "bold", fontSize: "15px" }}
            variant="outlined"
            onClick={() => setEditMode(true)}
          >
            수정
          </Button>
        )}

        {editMode && (
          <>
            <Button sx={{ fontWeight: "bold", fontSize: "15px" }}
              variant="contained"
              onClick={handleCreate}
            >
              + 신규 Forging 실사
            </Button>

            <Button sx={{ fontWeight: "bold", fontSize: "15px" }}
              variant="outlined"
              color="error"
              onClick={() => {
                if (window.confirm("수정모드를 종료하시겠습니까?")) {
                  setEditMode(false);
                }
              }}
            >
              종료
            </Button>
          </>
        )}
      </Paper>

      {/* ===============================
          🔹 목록 테이블
      =============================== */}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>실사일자</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" ,fontSize: "15px"}}>연도</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold",fontSize: "15px" }}>월</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>관리</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map(row => (
                <TableRow key={row.id}>
                  <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{row.audit_date}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{row.audit_year}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{row.audit_month}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                    {!editMode && (
                      <Button sx={{ fontWeight: "bold", fontSize: "15px" }}
                        size="small"
                        onClick={() =>
                          navigate(`/forging/${row.id}`)
                        }
                      >
                        열기
                      </Button>
                    )}

                    {editMode && (
                      <Button sx={{ fontWeight: "bold", fontSize: "15px" }}
                        size="small"
                        color="error"
                        onClick={() => handleDelete(row.id)}
                      >
                        삭제
                      </Button>
                    )}
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
