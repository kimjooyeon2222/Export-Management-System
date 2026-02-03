// src/pages/po/po_management.jsx
import React, { useState, useEffect, useRef } from "react";
import HorizontalScroll from "components/HorizontalScroll";

import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from "@mui/material";
const API_BASE = import.meta.env.VITE_API_URL;
import { apiFetch } from "api/apiFetch";

export default function POManagementPage() {

  // POManagementPage 맨 위 (import 아래)
  const token = localStorage.getItem("access_token");

  let loginCompany = "";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      loginCompany = payload.company || "";
    } catch (e) {
      loginCompany = "";
    }
  }



  const getThreeMonthRange = (baseMonth) => {
    const start = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1);
    const end = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 3, 0);
    return { start, end };
  };
  const getWeeksOfMonth = (year, month) => {
    const weeks = [];

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    let weekIndex = 1;
    let cursor = new Date(monthStart);

    while (cursor <= monthEnd) {
      const weekStart = new Date(cursor);
      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);

      weeks.push({
        year,
        month: month + 1,
        label: `${weekIndex}`,
        start: weekStart,
        end: weekEnd
      });

      cursor.setDate(cursor.getDate() + 7);
      weekIndex++;
    }

    return weeks;
  };


  const getMonthsBetween = (start, end) => {
    const months = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

    while (cursor <= end) {
      months.push({
        year: cursor.getFullYear(),
        month: cursor.getMonth() // 0-based
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
  };

  const getWeeksByMonthRange = (startDate, endDate) => {
    const months = getMonthsBetween(startDate, endDate);

    return months.flatMap(m =>
      getWeeksOfMonth(m.year, m.month)
    );
  };

  const isValidDateString = (v) =>
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v);

  const [visibleMonthStart, setVisibleMonthStart] = useState(null);

  const getDateRangeFromRows = (rows) => {
    const dates = [];

    rows.forEach(row => {
      row.subrows?.forEach(sub => {
        if (isValidDateString(sub.ototek_date))
          dates.push(new Date(sub.ototek_date));

        if (isValidDateString(sub.order_date))
          dates.push(new Date(sub.order_date));
      });
    });

    if (dates.length === 0) return null;

    return {
      start: new Date(Math.min(...dates)),
      end: new Date(Math.max(...dates))
    };
  };


  const [poRows, setPoRows] = useState([]);


  const ganttWeeks = React.useMemo(() => {
    const range = getDateRangeFromRows(poRows);
    if (!range) return [];
    return getWeeksByMonthRange(range.start, range.end);
  }, [poRows]);



  const visibleGanttWeeks = React.useMemo(() => {
    if (!visibleMonthStart) return [];

    const { start, end } = getThreeMonthRange(visibleMonthStart);

    return ganttWeeks.filter(
      (w) => w.end >= start && w.start <= end
    );
  }, [ganttWeeks, visibleMonthStart]);

  const ganttColCount = Math.max(visibleGanttWeeks.length, 1);

  const ProgressBar = ({ value, variant = "sub" }) => {
    const v = Math.max(0, Math.min(100, value));
    const isParent = variant === "parent";

    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: isParent ? 22 : 14,
          backgroundColor: isParent ? "#eef6ea" : "#f4f8ef",
          borderRadius: "4px",
          overflow: "hidden"
        }}
      >
        {/* 진행 바 */}
        <Box
          sx={{
            height: "100%",
            width: `${v}%`,
            background: isParent
              // 🔥 부모: 확실한 그라데이션
              ? "linear-gradient(90deg, #8fd48a 0%, #3fae66 100%)"
              // 🌿 자식: 단색 연두 (명확)
              : "#b6e58c",
            boxShadow: isParent
              ? "inset 0 0 0 1px rgba(0,0,0,0.05)"
              : "none",
            transition: "width 0.3s ease"
          }}
        />

        {/* 퍼센트 텍스트 */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isParent ? "13px" : "11px",
            fontWeight: isParent ? 700 : 600,
            color: isParent ? "#163b28" : "#2f4a2f",
            pointerEvents: "none"
          }}
        >
          {v}%
        </Box>
      </Box>
    );
  };


  const calcParentQty = (subrows = []) => {
    let ordered = 0;
    let received = 0;

    subrows.forEach(sub => {
      ordered += Number(sub.request_date || 0);
      received += Number(sub.method || 0);
    });

    return { ordered, received };
  };




  const ganttScrollRef = useRef(null);

  const subGanttRefs = useRef({});



  const monthScrollRef = useRef(null);
  const weekScrollRef = useRef(null);
  const [usDate, setUsDate] = useState("");




  useEffect(() => {
    const range = getDateRangeFromRows(poRows);
    if (!range) return;

    setVisibleMonthStart(
      new Date(range.start.getFullYear(), range.start.getMonth(), 1)
    );
  }, [poRows]);
  const isWeekActive = (week, sub) => {
    if (!sub.ototek_date || !sub.order_date) return false;

    const start = new Date(sub.ototek_date);
    const end = new Date(sub.order_date);

    return week.end >= start && week.start <= end;
  };

  const getParentDateRangeFromSubrows = (subrows = []) => {
    const starts = [];
    const ends = [];

    subrows.forEach(sub => {
      if (isValidDateString(sub.ototek_date)) {
        starts.push(new Date(sub.ototek_date));
      }
      if (isValidDateString(sub.order_date)) {
        ends.push(new Date(sub.order_date));
      }
    });

    if (!starts.length || !ends.length) return null;

    return {
      start: new Date(Math.min(...starts)), // ⭐ 가장 빠른 발주일자
      end: new Date(Math.max(...ends))      // ⭐ 가장 늦은 입고일자
    };
  };








  const visibleStartIndex = React.useMemo(() => {
    if (!visibleGanttWeeks.length) return 0;

    const firstVisible = visibleGanttWeeks[0];

    return ganttWeeks.findIndex(
      w => w.start.getTime() === firstVisible.start.getTime()
    );
  }, [ganttWeeks, visibleGanttWeeks]);

  /* ============================
     📊 Progress 계산
  ============================ */
  const calcSubProgress = (sub) => {
    const ordered = Number(sub.request_qty || sub.request_date || 0);
    const received = Number(sub.method || 0); // 임시: 입고품목수 위치

    if (!ordered) return 0;
    return Math.min(100, Math.round((received / ordered) * 100));
  };

  const calcParentProgress = (subrows = []) => {
    let ordered = 0;
    let received = 0;

    subrows.forEach(sub => {
      ordered += Number(sub.request_qty || sub.request_date || 0);
      received += Number(sub.method || 0);
    });

    if (!ordered) return 0;
    return Math.min(100, Math.round((received / ordered) * 100));
  };



  useEffect(() => {
    loadPOData();
    loadUsDate();   // ⭐ 북미 날짜 로드
  }, []);

  const loadPOData = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/po`);
      const data = await res.json();
      setPoRows(data);
    } catch (err) {
      console.error("불러오기 실패:", err);
    }
  };

  const loadUsDate = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/po/setting`);
      const data = await res.json();
      setUsDate(data.us_date || "");
    } catch (err) {
      console.error("us_date 불러오기 실패:", err);
    }
  };



  const handleSave = async () => {
    try {
      // 1) PO rows 저장
      await apiFetch(`${API_BASE}/api/po/bulk`, {
        method: "POST",
        body: JSON.stringify(poRows),
      });

      // 2) 북미 날짜 저장
      await apiFetch(`${API_BASE}/api/po/setting`, {
        method: "PUT",
        body: JSON.stringify({ us_date: usDate }),
      });

      alert("저장 완료!");
      setEditMode(false);
      loadPOData();
      loadUsDate();

    } catch (err) {
      console.error(err);
      alert("저장 중 오류 발생");
    }
  };



  /* ----------------------------------
        상태
  ---------------------------------- */
  const [editMode, setEditMode] = useState(false);
  const [poDeleteMode, setPoDeleteMode] = useState(false);
  const [selectedPoRowIds, setSelectedPoRowIds] = useState([]);
  const [showParentOnly, setShowParentOnly] = useState(true);
  const [partFilter, setPartFilter] = useState("전체");
  const PART_OPTIONS = [
    "전체",
    "CPC",
    "EV서브품",
    "HPDC",
    "고주파",
    "금형",
    "사상",
    "오일",
    "용해보온로"
  ];


  const updateSubCell = (parentId, subId, field, value) => {
    setPoRows(prev =>
      prev.map(row =>
        row.id === parentId
          ? {
            ...row,
            subrows: row.subrows.map(sub =>
              sub.id === subId
                ? {
                  ...sub,
                  [field]: value
                }
                : sub
            )
          }
          : row
      )
    );
  };



  const addSubRow = async (parentId) => {
    if (!editMode) return;

    try {
      const res = await apiFetch(
        `${API_BASE}/api/po/${parentId}/subrow`,
        { method: "POST" }
      );
      const newSub = await res.json();

      setPoRows(prev =>
        prev.map(r =>
          r.id === parentId
            ? { ...r, subrows: [...r.subrows, newSub] }
            : r
        )
      );
    } catch (e) {
      alert("subrow 추가 실패");
    }
  };

  const removeSubRow = async (parentId, subId) => {
    if (!editMode) return;

    if (!window.confirm("이 subrow를 삭제할까요?")) return;

    try {
      await apiFetch(
        `${API_BASE}/api/po/subrow/${subId}`,
        { method: "DELETE" }
      );

      setPoRows(prev =>
        prev.map(r =>
          r.id === parentId
            ? {
              ...r,
              subrows: r.subrows.filter(s => s.id !== subId)
            }
            : r
        )
      );
    } catch (e) {
      alert("subrow 삭제 실패");
    }
  };

  /* ----------------------------------
        제목 자동 생성
  ---------------------------------- */
  const getHeaderTitle = () => {
    if (!usDate) return "Purchase Order";
    const d = new Date(usDate);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    return `Purchase Order (${y}년  ${m}월)`;
  };





  /* ----------------------------------
        함수
  ---------------------------------- */
  const addRow = async () => {
    if (!editMode) return;

    try {
      const res = await apiFetch(`${API_BASE}/api/po`, {
        method: "POST"
      });
      const newRow = await res.json();

      setPoRows(prev => [...prev, newRow]);
    } catch {
      alert("행 추가 실패");
    }
  };
  const deleteRow = async (rowId) => {
    if (!editMode) return;

    if (!window.confirm("이 PO를 삭제할까요?")) return;

    try {
      await apiFetch(`${API_BASE}/api/po/${rowId}`, {
        method: "DELETE"
      });

      setPoRows(prev => prev.filter(r => r.id !== rowId));
    } catch {
      alert("행 삭제 실패");
    }
  };



  const updateCell = (id, field, value) => {
    setPoRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const filteredRows = poRows.filter(row => {
    // 파트구분 필터
    if (partFilter !== "전체" && row.manager !== partFilter) {
      return false;
    }

    return true;
  });



  /* ----------------------------------
        UI 렌더링
  ---------------------------------- */

  return (
    <Box sx={{ p: 3 }}>

      {/* 상단 버튼 영역 */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ fontSize: 22, fontWeight: "bold" }}>
          {getHeaderTitle()}
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              const next = !editMode;
              setEditMode(next);

              if (next) {
                setShowParentOnly(false);
              } else {
                setPoDeleteMode(false);
                setSelectedPoRowIds([]);
              }
            }}

            sx={{ fontWeight: "bold" }}
          >
            {editMode ? "수정모드 종료" : "수정모드 활성화"}
          </Button>


          <Button variant="contained" disabled={!editMode} onClick={handleSave} >
            저장
          </Button>


        </Box>
      </Box>

      {/* 날짜 입력 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, mt: 1, fontSize: "15px", fontWeight: "bold" }}>
        <TextField
          label="북미 기준 날짜 (YYYY-MM-DD)"
          size="small"
          value={usDate}
          onChange={(e) => editMode && setUsDate(e.target.value)}
          InputProps={{ readOnly: !editMode }}
          sx={{ width: 200 }}
        />
      </Box>
      {/* 필터 + 행추가/행삭제를 같은 라인에 배치 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
          mb: 1
        }}
      >
        {/* 왼쪽: 필터 영역 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            variant="outlined"
            sx={{ fontWeight: "bold", fontSize: "15px" }}
            onClick={() => setShowParentOnly(prev => !prev)}
          >
            PO 상세
          </Button>


          {/* ⭐ 파트구분 콤보박스 */}
          <Select
            size="small"
            value={partFilter}
            onChange={(e) => setPartFilter(e.target.value)}
            sx={{
              minWidth: 140,
              fontWeight: "bold",
              "& .MuiSelect-select": {
                fontWeight: "bold"
              }
            }}
          >
            {PART_OPTIONS.map(opt => (
              <MenuItem key={opt} value={opt} sx={{ fontWeight: "bold" }}>
                {opt}

              </MenuItem>
            ))}
          </Select>
        </Box>


        {/* 오른쪽: 행추가/행삭제 버튼 */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            disabled={!editMode}
            onClick={addRow}
          >
            + 행추가
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={!editMode}
            onClick={async () => {
              // 1️⃣ 삭제모드 진입
              if (!poDeleteMode) {
                setPoDeleteMode(true);
                setSelectedPoRowIds([]);

                alert("삭제할 PO 행을 선택하세요."); 

                return;
              }


              // 2️⃣ 선택 안 했을 때
              if (selectedPoRowIds.length === 0) {
                alert("삭제할 PO 행을 선택하세요.");
                return;
              }

              // 3️⃣ DB 삭제 (부모만 삭제 → subrow는 cascade)
              for (const id of selectedPoRowIds) {
                await apiFetch(`${API_BASE}/api/po/${id}`, {
                  method: "DELETE",
                });
              }

              // 4️⃣ 프론트 반영
              setPoRows(prev => prev.filter(r => !selectedPoRowIds.includes(r.id)));

              // 5️⃣ 초기화
              setSelectedPoRowIds([]);
              setPoDeleteMode(false);
            }}
          >
            {poDeleteMode ? "선택 삭제" : "- 행삭제"}
          </Button>


        </Box>
      </Box>


      {/* 메인 테이블 */}
      <Paper
        sx={{ p: 2, border: 'none', boxShadow: 'none' }}
        elevation={0}
      >

        <Table
          size="small"
          sx={{
            tableLayout: "fixed",
            width: "100%"
          }}
        >
          <colgroup>
            {/* ===== 좌측 발주정보 영역 (70%) ===== */}
            <col style={{ width: "10%" }} />  {/* 발주진행명 */}
            <col style={{ width: "6%" }} />  {/* 파트구분 */}

            <col style={{ width: "12%" }} />  {/* 발주번호 / 업체 */}
            <col style={{ width: "8%" }} />   {/* 발주일자 */}
            <col style={{ width: "6%" }} />   {/* 작업일수 */}

            <col style={{ width: "8%" }} />   {/* 입고일자 */}

            <col style={{ width: "7%" }} />   {/* 발주품목 수 */}
            <col style={{ width: "7%" }} />  {/* 입고품목 수 */}

            <col style={{ width: "6%" }} />   {/* 진행률 */}

            {/* ===== 우측 간트 영역 (30%) ===== */}
            {Array.from({ length: ganttColCount }).map((_, i) => (
              <col
                key={i}
                style={{
                  minWidth: 28,
                  width: `${30 / ganttColCount}%`
                }}
              />
            ))}


          </colgroup>

          <TableHead
            sx={{
              bgcolor: "#e6f3ff",
              "& th": {
                fontWeight: "bold",
                fontSize: "15px"
              }
            }}
          >
            {/* 🔹 월 헤더 (추가된 부분) */}
            <TableRow>
              {/* 왼쪽 고정 컬럼 영역 비우기 */}
              <TableCell colSpan={9} />


              <TableCell colSpan={ganttColCount} sx={{ p: 0 }}>

                <HorizontalScroll

                  onScroll={(e) => {
                    const left = e.target.scrollLeft;
                    if (monthScrollRef.current)
                      monthScrollRef.current.scrollLeft = left;

                    if (weekScrollRef.current)
                      weekScrollRef.current.scrollLeft = left;

                    // ⭐ sub Gantt 전부 강제 동기화
                    Object.values(subGanttRefs.current).forEach(el => {
                      if (el) el.scrollLeft = left;
                    });
                  }}

                >

                  <Box sx={{ display: "flex" }}>
                    {Object.entries(
                      ganttWeeks.reduce((acc, w) => {
                        const key = `${w.year}-${w.month}`;
                        acc[key] = acc[key] || { year: w.year, month: w.month, count: 0 };
                        acc[key].count++;
                        return acc;
                      }, {})
                    ).map(([key, v]) => (
                      <Box
                        key={key}
                        sx={{
                          minWidth: v.count * 28,
                          textAlign: "center",
                          fontWeight: "bold",
                          borderRight: "1px solid #ddd"
                        }}
                      >
                        {v.year}년 {v.month}월
                      </Box>
                    ))}
                  </Box>
                </HorizontalScroll>

              </TableCell>


            </TableRow>

            {/* 🔹 기존 헤더 (❗️아무것도 수정 안 함) */}
            <TableRow>

              {/* 결재목차 + 운송방법 숨김 */}


              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                발주진행명
              </TableCell>



              {/* 담당자 숨김 */}

              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                파트구분
              </TableCell>


              {/* ⭐ 업체는 항상 표시 */}
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                발주번호 / 업체
                <Box sx={{ fontSize: "13px", lineHeight: 1.2, fontWeight: "bold", color: "#777" }}>
                  (수정자)
                </Box>
              </TableCell>


              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                발주일자
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                작업일수
              </TableCell>


              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                입고일자
              </TableCell>

              <TableCell
                align="center"
                sx={{ fontWeight: "bold", fontSize: "15px", position: "relative" }}
              >
                발주품목 수
              </TableCell>

              {/* 결재목차 + 운송방법 숨김 */}


              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                입고품목 수
              </TableCell>



              <TableCell align="center">진행률</TableCell>

              <TableCell colSpan={ganttColCount} sx={{ p: 0 }}>

                <HorizontalScroll
                  ref={weekScrollRef}
                  showButtons={false}
                  onScroll={(e) => {
                    const left = e.target.scrollLeft;

                    if (monthScrollRef.current)
                      monthScrollRef.current.scrollLeft = left;

                    if (ganttScrollRef.current)
                      ganttScrollRef.current.scrollLeft = left;
                  }}
                >

                  <Box sx={{ display: "flex" }}>
                    {ganttWeeks.map((week, i) => (
                      <Box
                        key={i}
                        sx={{
                          minWidth: 28,
                          textAlign: "center",
                          fontSize: "12px",
                          borderRight: "1px solid #ddd"
                        }}
                      >
                        {week.label}
                      </Box>
                    ))}
                  </Box>
                </HorizontalScroll>
              </TableCell>

            </TableRow>
          </TableHead>


          <TableBody>
            {filteredRows.map((row) => {
              const { ordered, received } = calcParentQty(row.subrows);

              const parentRange = getParentDateRangeFromSubrows(row.subrows);

              const parentOtotekDate = parentRange
                ? parentRange.start.toISOString().slice(0, 10)
                : "";

              const parentOrderDate = parentRange
                ? parentRange.end.toISOString().slice(0, 10)
                : "";

              return (
                <React.Fragment key={row.id}>

                  {/* 부모 행 */}
                  <TableRow
                    onClick={() => {
                      if (!editMode || !poDeleteMode) return;

                      setSelectedPoRowIds(prev =>
                        prev.includes(row.id)
                          ? prev.filter(id => id !== row.id)
                          : [...prev, row.id]
                      );
                    }}
                    sx={{
                      height: 42,
                      fontWeight: "bold",
                      fontSize: "15px",
                      borderTop: "3px solid #e0e0e0",
                      cursor: poDeleteMode ? "pointer" : "default",
                      backgroundColor: selectedPoRowIds.includes(row.id)
                        ? "#cfe8ff"   // ⭐ 선택 강조
                        : "inherit",
                    }}
                  >

                    {/* 결재목차 */}

                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "13px", borderBottom: "5px solid #c2c2c2" }}>
                      {editMode ? (
                        <TextField
                          size="small"
                          value={row.subject}
                          onClick={(e) => {
                            if (poDeleteMode) e.stopPropagation();
                          }}
                          onChange={(e) => updateCell(row.id, "subject", e.target.value)}
                        />

                      ) : (
                        row.subject
                      )}
                    </TableCell>


                    {/* 파트구분 */}

                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      {editMode ? (
                        <TextField
                          size="small"
                          value={row.manager}
                          onClick={(e) => {
                            if (poDeleteMode) e.stopPropagation();
                          }}
                          onChange={(e) => updateCell(row.id, "manager", e.target.value)}
                        />
                      ) : (
                        row.manager
                      )}
                    </TableCell>





                    {/* 업체 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      {editMode ? (
                        <TextField
                          size="small"
                          value={row.company}
                          onClick={(e) => {
                            if (poDeleteMode) e.stopPropagation();
                          }}
                          onChange={(e) => updateCell(row.id, "company", e.target.value)}
                        />
                      ) : (
                        row.company
                      )}
                    </TableCell>



                    {/* 오토텍->발주일자 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      {parentOtotekDate}
                    </TableCell>



                    {/* 작업일수 */}
                    <TableCell align="center">

                    </TableCell>

                    {/* 북미 발주일자 -> 입고일자*/}

                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      {parentOrderDate}
                    </TableCell>



                    {/* 북미도착요청일자 -> 발주 품목 수 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 1
                        }}
                      >
                        {/* ⭐ sub 합계만 표시 */}
                        <Box>{ordered}</Box>

                        {/* + 버튼만 editMode일 때 */}
                        {editMode && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              addSubRow(row.id);
                            }}
                            sx={{ minWidth: 26, padding: "0 6px" }}
                          >
                            +
                          </Button>
                        )}
                      </Box>
                    </TableCell>


                    {/* 운송방법-> 입고 품목 수 */}
                    {/* 입고품목 수 (부모도 입력 가능) */}
                    {/* 운송방법 -> 입고 품목 수 */}

                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      {received}
                    </TableCell>



                    {/* 📊 부모 진행률 */}
                    <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>
                      <ProgressBar value={calcParentProgress(row.subrows)} variant="parent" />
                    </TableCell>
                    <TableCell colSpan={ganttColCount} sx={{ p: 0 }}>
                      <Box
                        ref={(el) => {
                          if (el) subGanttRefs.current[`parent-${row.id}`] = el;
                        }}
                        sx={{
                          overflow: "hidden", pl: "7px"   // ⭐ 스크롤 제거
                        }}
                      >
                        <Box sx={{ display: "flex" }}>
                          {ganttWeeks.map((week, i) => {
                            const range = getParentDateRangeFromSubrows(row.subrows);
                            const active =
                              range &&
                              week.end >= range.start &&
                              week.start <= range.end;

                            return (
                              <Box
                                key={i}
                                sx={{
                                  minWidth: 28,
                                  height: 42,
                                  bgcolor: active ? "#82b1ff" : "#f5f5f5",
                                  borderRight: "1px solid #eee"
                                }}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    </TableCell>


                  </TableRow>

                  {/* ⭐ subrow 렌더링 (부모 바로 아래) */}
                  {!showParentOnly &&
                    row.subrows.map((sub, index) => (
                      <React.Fragment key={sub.id}>


                        {/* subRow 실제 데이터 */}
                        <TableRow
                          sx={{
                            bgcolor: selectedPoRowIds.includes(row.id)
                              ? "#eaf2ff"    // ⭐ 부모 선택 시 같이 표시
                              : "#fff",
                            height: 42,
                            "& td": {
                              fontWeight: "bold",
                              padding: "6px 8px",
                              fontSize: "15px",
                            },
                          }}
                        >


                          {/* 결재목차 ->  발주진행명 */}


                          <TableCell />



                          {/* 담당자-> 파트구분 */}
                          <TableCell />




                          {/* 업체 */}
                          <TableCell align="center">
                            {editMode ? (
                              <TextField
                                size="small"
                                value={sub.company}
                                onClick={(e) => {
                                  if (poDeleteMode) e.stopPropagation();
                                }}
                                onChange={(e) =>
                                  updateSubCell(row.id, sub.id, "company", e.target.value)
                                }
                              />
                            ) : (
                              <>
                                {sub.company}
                                {sub.editor_company && (
                                  <span style={{ marginLeft: 4, fontSize: 12, color: "#666" }}>
                                    ({sub.editor_company})
                                  </span>
                                )}
                              </>
                            )}
                          </TableCell>




                          {/* 오토텍 -> 발주일자*/}
                          <TableCell align="center">
                            {editMode ? (
                              <TextField
                                size="small"
                                value={sub.ototek_date}
                                onClick={(e) => {
                                  if (poDeleteMode) e.stopPropagation();
                                }}
                                onChange={(e) =>
                                  updateSubCell(row.id, sub.id, "ototek_date", e.target.value)
                                }
                              />
                            ) : (
                              sub.ototek_date
                            )}
                          </TableCell>

                          {/* 남은 일수-> 작업일수 */}
                          <TableCell align="center">
                            {editMode ? (
                              <TextField
                                size="small"
                                value={sub.work_days}
                                onClick={(e) => {
                                  if (poDeleteMode) e.stopPropagation();
                                }}
                                onChange={(e) =>
                                  updateSubCell(row.id, sub.id, "work_days", e.target.value)
                                }
                              />
                            ) : (
                              sub.work_days
                            )}
                          </TableCell>

                          {/* 북미발주 빈칸 -> 입고일자 */}
                          <TableCell align="center">
                            {editMode ? (
                              <TextField
                                size="small"
                                value={sub.order_date}
                                onClick={(e) => {
                                  if (poDeleteMode) e.stopPropagation();
                                }}
                                onChange={(e) =>
                                  updateSubCell(row.id, sub.id, "order_date", e.target.value)
                                }
                              />
                            ) : (
                              sub.order_date
                            )}
                          </TableCell>

                          {/* (A) 요청일자 + 삭제 버튼을 같은 셀 안에 넣기 -> 발주품목 수 */}
                          <TableCell align="center">
                            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>
                              {editMode ? (
                                <TextField
                                  size="small"
                                  value={sub.request_date}
                                  onClick={(e) => {
                                    if (poDeleteMode) e.stopPropagation();
                                  }}
                                  onChange={(e) =>
                                    updateSubCell(row.id, sub.id, "request_date", e.target.value)
                                  }
                                />
                              ) : (
                                sub.request_date
                              )}

                              {editMode && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeSubRow(row.id, sub.id);
                                  }}


                                  sx={{ minWidth: "26px", padding: "0 6px" }}
                                >
                                  -
                                </Button>
                              )}
                            </Box>
                          </TableCell>






                          {/* 운송수단 -> 입고 품목 수 */}
                          {/* 입고품목 수 (기존 method 사용) */}

                          <TableCell align="center">
                            {editMode ? (
                              <TextField
                                size="small"
                                value={sub.method}
                                onClick={(e) => {
                                  if (poDeleteMode) e.stopPropagation();
                                }}
                                onChange={(e) =>
                                  updateSubCell(row.id, sub.id, "method", e.target.value)
                                }
                              />
                            ) : (
                              sub.method
                            )}
                          </TableCell>

                          {/* 📊 sub 진행률 */}
                          <TableCell align="center">
                            <ProgressBar value={calcSubProgress(sub)} />
                          </TableCell>


                          {/* 📅 sub Gantt */}
                          <TableCell colSpan={ganttColCount} sx={{ p: 0 }}>
                            <Box
                              ref={(el) => {
                                if (el) subGanttRefs.current[sub.id] = el;
                              }}
                              sx={{
                                overflow: "hidden"   // ❗ 스크롤 금지
                              }}
                            >
                              <Box sx={{ display: "flex" }}>
                                {ganttWeeks.map((week, i) => (
                                  <Box
                                    key={i}
                                    sx={{
                                      minWidth: 28,
                                      height: 42,
                                      bgcolor: isWeekActive(week, sub)
                                        ? "rgba(130,177,255,0.35)"
                                        : "#f5f5f5",
                                      borderRadius: isWeekActive(week, sub) ? "2px" : 0,

                                      borderRight: "1px solid #eee"
                                    }}
                                  />
                                ))}


                              </Box>
                            </Box>
                          </TableCell>




                        </TableRow>

                      </React.Fragment>
                    ))}
                </React.Fragment>
              );
            })}

          </TableBody>

        </Table>
      </Paper>
    </Box>
  );
}
