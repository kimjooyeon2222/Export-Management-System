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
import { v4 as uuidv4 } from "uuid";
const API_BASE = import.meta.env.VITE_API_URL;
import { apiFetch } from "api/apiFetch";

export default function POManagementPage() {
  const isValidDateString = (v) =>
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v);


  const ganttScrollRef = useRef(null);

  const subGanttRefs = useRef({});

  const [visibleMonthStart, setVisibleMonthStart] = useState(null);
  const getThreeMonthRange = (baseMonth) => {
    const start = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1);
    const end = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 3, 0);
    return { start, end };
  };

  const monthScrollRef = useRef(null);
  const weekScrollRef = useRef(null);
  const [usDate, setUsDate] = useState("");
  useEffect(() => {
    if (!usDate) return;
    const d = new Date(usDate);
    setVisibleMonthStart(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [usDate]);

  const [poRows, setPoRows] = useState([
    {
      id: uuidv4(),
      order_date: "",
      request_date: "",
      ototek_date: "",
      manager: "",
      company: "",   // ⭐ 추가된 업체 컬럼
      subject: "",
      method: "",
      subrows: []   // ⭐ 여기 추가

    }

  ]);
  const isWeekActive = (week, sub) => {
    if (!sub.ototek_date || !sub.order_date) return false;

    const start = new Date(sub.ototek_date);
    const end = new Date(sub.order_date);

    return week.end >= start && week.start <= end;
  };

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
  const getWeeksByMonthRange = (startDate, endDate) => {
    const months = getMonthsBetween(startDate, endDate);

    return months.flatMap(m =>
      getWeeksOfMonth(m.year, m.month)
    );
  };


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

  const removeSubRow = (parentId, subId) => {
    setPoRows(prev =>
      prev.map(r =>
        r.id === parentId
          ? {
            ...r,
            subrows: r.subrows.filter(sub => sub.id !== subId)
          }
          : r
      )
    );
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
  const [showIncomingOnly, setShowIncomingOnly] = useState(false);


  const updateSubCell = (parentId, subId, field, value) => {
    setPoRows(prev =>
      prev.map(row =>
        row.id === parentId
          ? {
            ...row,
            subrows: row.subrows.map(sub =>
              sub.id === subId
                ? { ...sub, [field]: value }
                : sub
            )
          }
          : row
      )
    );
  };

  const addSubRow = (parentId) => {
    setPoRows(prev =>
      prev.map(r =>
        r.id === parentId
          ? {
            ...r,
            subrows: [
              ...r.subrows,
              {
                id: uuidv4(),
                request_date: "",
                ototek_date: "",
                order_date: "",
                work_days: "",
                company: "",
                method: ""
              }
            ]
          }
          : r
      )
    );
  };



  /* ----------------------------------
        제목 자동 생성
  ---------------------------------- */
  const getHeaderTitle = () => {
    if (!usDate) return "PO# INFO";
    const d = new Date(usDate);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    return `PO# INFO (${y}년  ${m}월)`;
  };





  /* ----------------------------------
        함수
  ---------------------------------- */
  const addRow = () => {
    if (!editMode) return;
    setPoRows((prev) => [
      ...prev,
      {
        id: uuidv4(),
        order_date: "",
        request_date: "",
        ototek_date: "",
        manager: "",
        company: "",
        subject: "",
        method: "해운",
        subrows: []
      }
    ]);
  };

  const deleteRow = () => {
    if (!editMode || poRows.length <= 1) return;
    setPoRows((prev) => prev.slice(0, -1));
  };

  const updateCell = (id, field, value) => {
    setPoRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const filteredRows = poRows;


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
            onClick={() => setEditMode(!editMode)}
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
        {/* 왼쪽: 필터 버튼 */}
        <Button
          variant="outlined"
          sx={{ fontWeight: "bold", fontSize: "15px", mb: 0.5 }}
          onClick={() => setShowIncomingOnly(prev => !prev)}
        >
          도착예정 필터
        </Button>

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
            onClick={deleteRow}
          >
            - 행삭제
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
            {!showIncomingOnly && <col style={{ width: "10%" }} />}  {/* 발주진행명 */}
            {!showIncomingOnly && <col style={{ width: "6%" }} />}   {/* 파트구분 */}

            <col style={{ width: "12%" }} />  {/* 발주번호 / 업체 */}
            <col style={{ width: "8%" }} />   {/* 발주일자 */}
            <col style={{ width: "6%" }} />   {/* 작업일수 */}

            {!showIncomingOnly && <col style={{ width: "8%" }} />}   {/* 입고일자 */}

            <col style={{ width: "7%" }} />   {/* 발주품목 수 */}
            {!showIncomingOnly && <col style={{ width: "7%" }} />}   {/* 입고품목 수 */}

            <col style={{ width: "6%" }} />   {/* 진행률 */}

            {/* ===== 우측 간트 영역 (30%) ===== */}
            {visibleGanttWeeks.length > 0 &&
              visibleGanttWeeks.map((_, i) => (
                <col
                  key={i}
                  style={{
                    minWidth: 28,
                    width: `${30 / visibleGanttWeeks.length}%`
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
              <TableCell
                colSpan={
                  (!showIncomingOnly ? 2 : 0) + // 발주진행명, 파트구분
                  1 + // 발주번호 / 업체
                  1 + // 발주일자
                  1 + // 작업일수
                  (!showIncomingOnly ? 1 : 0) + // 입고일자
                  1 + // 발주품목 수
                  (!showIncomingOnly ? 1 : 0) + // 입고품목 수
                  1   // 진행률
                }
              />

              <TableCell colSpan={visibleGanttWeeks.length} sx={{ p: 0 }}>

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
              {!showIncomingOnly && (
                <>
                  <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                    발주진행명<br /> (수정자)
                  </TableCell>
                </>
              )}

              {/* 담당자 숨김 */}
              {!showIncomingOnly && (
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                  파트구분
                </TableCell>
              )}

              {/* ⭐ 업체는 항상 표시 */}
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                발주번호 / 업체
              </TableCell>

              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                발주일자
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                작업일수
              </TableCell>

              {!showIncomingOnly && (
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                  입고일자
                </TableCell>
              )}
              <TableCell
                align="center"
                sx={{ fontWeight: "bold", fontSize: "15px", position: "relative" }}
              >
                발주품목 수
              </TableCell>

              {/* 결재목차 + 운송방법 숨김 */}
              {!showIncomingOnly && (
                <>
                  <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                    입고품목 수
                  </TableCell>
                </>
              )}

              <TableCell align="center">진행률</TableCell>

              <TableCell colSpan={ganttWeeks.length} sx={{ p: 0 }}>
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

              return (
                <React.Fragment key={row.id}>

                  {/* 부모 행 */}
                  <TableRow sx={{
                    height: 42, fontWeight: "bold", fontSize: "15px",
                    borderTop: "3px solid #e0e0e0",   // ⭐⭐ 여기 추가!!

                  }}>
                    {/* 결재목차 */}
                    {!showIncomingOnly && (
                      <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "13px", borderBottom: "5px solid #c2c2c2" }}>
                        {editMode ? (
                          <TextField
                            size="small"
                            value={row.subject}
                            onChange={(e) => updateCell(row.id, "subject", e.target.value)}
                          />
                        ) : (
                          row.subject
                        )}
                      </TableCell>
                    )}

                    {/* 파트구분 */}
                    {!showIncomingOnly && (
                      <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                        {editMode ? (
                          <TextField
                            size="small"
                            value={row.manager}
                            onChange={(e) => updateCell(row.id, "manager", e.target.value)}
                          />
                        ) : (
                          row.manager
                        )}
                      </TableCell>
                    )}




                    {/* 업체 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      {editMode ? (
                        <TextField
                          size="small"
                          value={row.company}
                          onChange={(e) => updateCell(row.id, "company", e.target.value)}
                        />
                      ) : (
                        row.company
                      )}
                    </TableCell>



                    {/* 오토텍->발주일자 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      {editMode ? (
                        <TextField
                          size="small"
                          value={row.ototek_date}
                          onChange={(e) => updateCell(row.id, "ototek_date", e.target.value)}
                        />
                      ) : (
                        row.ototek_date
                      )}
                    </TableCell>


                    {/* 작업일수 */}
                    <TableCell align="center">

                    </TableCell>

                    {/* 북미 발주일자 -> 입고일자*/}
                    {!showIncomingOnly && (
                      <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                        {editMode ? (
                          <TextField
                            size="small"
                            value={row.order_date}
                            onChange={(e) => updateCell(row.id, "order_date", e.target.value)}
                          />
                        ) : (
                          <Box>
                            {row.order_date}
                          </Box>
                        )}
                      </TableCell>
                    )}

                    {/* 북미도착요청일자 -> 발주 품목 수 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>

                        {/* 날짜 입력/표시 */}
                        {editMode ? (
                          <TextField
                            size="small"
                            value={row.request_date}
                            onChange={(e) => updateCell(row.id, "request_date", e.target.value)}
                          />
                        ) : (
                          row.request_date
                        )}

                        {/* + / - 버튼 */}
                        {editMode && (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => addSubRow(row.id)}
                              sx={{ minWidth: 26, padding: "0 6px" }}
                            >
                              +
                            </Button>


                          </>
                        )}
                      </Box>
                    </TableCell>

                    {/* 운송방법-> 입고 품목 수 */}
                    {/* 입고품목 수 (부모도 입력 가능) */}
                    {!showIncomingOnly && (
                      <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                        {editMode ? (
                          <TextField
                            size="small"
                            value={row.method}
                            onChange={(e) =>
                              updateCell(row.id, "method", e.target.value)
                            }
                          />
                        ) : (
                          row.method
                        )}
                      </TableCell>
                    )}

                    {/* 📊 부모 진행률 */}
                    <TableCell align="center">
                      {calcParentProgress(row.subrows)}%
                    </TableCell>

                    <TableCell colSpan={ganttWeeks.length} sx={{ p: 0 }}>
                      <HorizontalScroll
                        ref={ganttScrollRef}
                        showButtons={false}
                        hideScrollbar

                        onScroll={(e) => {
                          const left = e.target.scrollLeft;

                          if (monthScrollRef.current)
                            monthScrollRef.current.scrollLeft = left;

                          if (weekScrollRef.current)
                            weekScrollRef.current.scrollLeft = left;
                        }}
                      >
                        <Box sx={{ display: "flex" }}>
                          {ganttWeeks.map((week, i) => {
                            const active = row.subrows.some(sub =>
                              isWeekActive(week, sub)
                            );

                            return (
                              <Box
                                key={i}
                                sx={{
                                  minWidth: 28,
                                  height: 42,
                                  bgcolor: active ? "#e3f2fd" : "#f5f5f5",
                                  borderRight: "1px solid #eee"
                                }}
                              />
                            );
                          })}

                        </Box>
                      </HorizontalScroll>
                    </TableCell>




                  </TableRow>

                  {/* ⭐ subrow 렌더링 (부모 바로 아래) */}
                  {row.subrows.map((sub, index) => (
                    <React.Fragment key={sub.id}>


                      {/* subRow 실제 데이터 */}
                      <TableRow
                        sx={{
                          bgcolor: "#fff",
                          height: 42,                // 부모와 동일한 세로 높이

                          "& td": {
                            fontWeight: "bold",
                            padding: "6px 8px",     // 부모와 비슷한 padding 적용
                            fontSize: "15px"        // 글자 크기도 동일하게
                          }
                        }}
                      >

                        {/* 결재목차 ->  발주진행명 */}
                        {!showIncomingOnly && (
                          <>
                            <TableCell />
                          </>
                        )}

                        {/* 담당자-> 파트구분 */}
                        {!showIncomingOnly && <TableCell />}




                        {/* 업체 */}
                        <TableCell align="center">
                          {editMode ? (
                            <TextField
                              size="small"
                              value={sub.company}
                              onChange={(e) =>
                                updateSubCell(row.id, sub.id, "company", e.target.value)
                              }
                            />
                          ) : (
                            sub.company
                          )}
                        </TableCell>




                        {/* 오토텍 -> 발주일자*/}
                        <TableCell align="center">
                          {editMode ? (
                            <TextField
                              size="small"
                              value={sub.ototek_date}
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
                                onClick={() => removeSubRow(row.id, sub.id)}


                                sx={{ minWidth: "26px", padding: "0 6px" }}
                              >
                                -
                              </Button>
                            )}
                          </Box>
                        </TableCell>






                        {/* 운송수단 -> 입고 품목 수 */}
                        {/* 입고품목 수 (기존 method 사용) */}
                        {!showIncomingOnly && (
                          <TableCell align="center">
                            {editMode ? (
                              <TextField
                                size="small"
                                value={sub.method}
                                onChange={(e) =>
                                  updateSubCell(row.id, sub.id, "method", e.target.value)
                                }
                              />
                            ) : (
                              sub.method
                            )}
                          </TableCell>
                        )}
                        {/* 📊 sub 진행률 */}
                        <TableCell align="center">
                          {calcSubProgress(sub)}%
                        </TableCell>

                        {/* 📅 sub Gantt */}
                        <TableCell colSpan={visibleGanttWeeks.length} sx={{ p: 0 }}>
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
                                    bgcolor: isWeekActive(week, sub) ? "#90caf9" : "#f5f5f5",
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
