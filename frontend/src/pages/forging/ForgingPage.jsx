import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "api/apiFetch";
import { useParams } from "react-router-dom";
import ItemSearchDialog from "components/dialog/ItemSearchDialog";



export default function ForgingPage() {



  async function fetchInvItemQty(inv_no, itemCode, itemName) {
    const res = await apiFetch(`${API_BASE}/api/forging/inv-item-qty`, {

      method: "POST",
      body: JSON.stringify({
        inv_no,
        item_code: itemCode,
        item_name: itemName,
      }),
    });

    // 🔥 1단계: 상태 체크
    if (!res.ok) {
      console.error("❌ qty fetch failed", res.status);
      return 0;
    }

    // 🔥 2단계: text로 먼저 받기
    const text = await res.text();

    // 🔥 3단계: 비어 있으면 바로 리턴
    if (!text) {
      console.warn("⚠️ qty API returned empty response");
      return 0;
    }

    // 🔥 4단계: 그 다음에만 JSON 파싱
    const data = JSON.parse(text);
    return Number(data.qty || 0);
  }



  async function loadRowQuantities(inv_no) {
    // ⭐ 품목 미선택 시 바로 종료
    if (scheduleItems.length === 0) {
      console.warn("⚠️ 품목 먼저 선택 필요");
      return {};
    }

    console.log("🔥 loadRowQuantities 시작:", inv_no);
    console.log("🔥 scheduleItems:", scheduleItems);

    const quantities = {};

    for (const it of scheduleItems) {
      if (!it.itemCode || !it.itemName) continue;

      console.log(
        "🔥 qty fetch",
        inv_no,
        it.itemCode,
        it.itemName
      );

      const qty = await fetchInvItemQty(
        inv_no,
        it.itemCode,
        it.itemName
      );

      quantities[it.itemCode] = qty;
    }

    console.log("🔥 loadRowQuantities 결과:", quantities);
    return quantities;
  }


  // 품목 데이터
  const [items, setItems] = useState([]);

  const scheduleItems = items.filter(
    it => it.itemCode && it.itemName
  );


useEffect(() => {
  if (!scheduleItems.length) return;
  if (!rows.length) return;

  console.log("🔥 품목 변경 → 모든 INV qty 재계산");

  let cancelled = false;

  (async () => {
    const updated = await Promise.all(
      rows.map(async (row) => {
        if (!row.inv_no) return row;

        const quantities = await loadRowQuantities(row.inv_no);

        return {
          ...row,
          quantities
        };
      })
    );

    if (!cancelled) {
      setRows(updated);
    }
  })();

  return () => {
    cancelled = true;
  };
}, [scheduleItems.length]);



  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [targetItemIndex, setTargetItemIndex] = useState(null);
  const handleSelectItem = (item) => {
    if (targetItemIndex === null) return;

    setItems(prev =>
      prev.map((it, idx) =>
        idx === targetItemIndex
          ? {
            ...it,
            itemCode: item.item_no,
            itemName: item.item_name,
            unit: item.box_qty || 0, // 필요 시
          }
          : it
      )
    );
  };

  const { auditId } = useParams();

  const getForgingJudgeStyle = (status) => {
    switch (status) {
      case "초과":
        return {
          bgcolor: "#fff2cc",     // 🔄 연노랑
          color: "#7f6000",       // 🔄 갈색
          fontWeight: "bold",
          borderRadius: "6px",
          px: 1.2,
          display: "inline-block"
        };
      case "양호":
        return {
          bgcolor: "#d9ead3",     // 연연두 배경
          color: "#274e13",       // 짙은 초록 글씨
          fontWeight: "bold",
          borderRadius: "6px",
          px: 1.2,
          display: "inline-block"
        };
      case "위험":
        return {
          bgcolor: "#f4cccc",     // 연분홍 배경
          color: "#990000",       // 진빨강 글씨
          fontWeight: "bold",
          borderRadius: "6px",
          px: 1.2,
          display: "inline-block"
        };
      case "적정재고미달":
        return {
          bgcolor: "#ead1dc",     // 🔄 연보라
          color: "#99004d",       // 🔄 진보라
          fontWeight: "bold",
          borderRadius: "6px",
          px: 1.2,
          display: "inline-block"
        };
      default:
        return {
          bgcolor: "#eeeeee",
          color: "#000",
          fontWeight: "bold",
          borderRadius: "6px",
          px: 1.2,
          display: "inline-block"
        };
    }
  };


  function formatKRDate(date) {
    const local = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    return local.toISOString().split("T")[0];
  }


  const [showStockPanel, setShowStockPanel] = useState(false);

  // 미국 Alabama(중부시간) 기준 '오늘 00:00' 생성
  function todayUS() {
    const nowUS = new Date().toLocaleString("en-US", {
      timeZone: "America/Chicago",
    });

    const d = new Date(nowUS);
    d.setHours(0, 0, 0, 0);
    return d;
  }





  const getEtaStyle = (status) => {
    if (status === "운항중") {
      return {
        bgcolor: "#ffe6f1",   // 분홍 배경
        color: "#c41d7f",     // 빨간 글씨
        fontWeight: "bold",
        borderRadius: "6px",
        px: 1
      };
    }
    return {};
  };


  const [editMode, setEditMode] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();






  function parseUSDate(dateValue) {
    if (!dateValue) return null;

    const [y, m, d] = dateValue.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 6, 0, 0)); // 미국 00:00 = UTC+6
  }

  function parseKRDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, -9, 0, 0));  // 한국 00시 고정
  }


  useEffect(() => {
    async function loadForgingAuditDetail() {
      const res = await apiFetch(
        `${API_BASE}/api/forging-audits/${auditId}/detail`
      );
      const data = await res.json();

      // 🔹 기본 정보
      setUsDate(data.audit_date || "");
      setWriter(data.writer || "");
      setTargetStock(data.target_stock || 30000);

      // 🔥🔥🔥 핵심 1: 과부족 상태표 품목 복원
      const loadedItems = (data.items || []).map(it => ({
        id: uuidv4(),
        itemCode: it.item_code,
        itemName: it.item_name,
        overStock: Number(it.over_stock || 0),
        defect: Number(it.defect || 0),
        normalStock:
          Number(it.over_stock || 0) - Number(it.defect || 0),
        running: 0,
        unit: Number(it.unit || 0),
      }));

      setItems(loadedItems);

      // 🔹 운송 스케줄
      const parsedRows = (data.rows || []).map(r => ({
        ...r,
        quantities: r.quantities || {},
        etd: r.etd ? parseKRDate(r.etd) : null,
        eta: r.eta ? parseUSDate(r.eta) : null,
        status: r.status || ""   // ⭐ 서버값 있으면 쓰고, 없으면 비워둠
      }));

      setRows(parsedRows);


    }

    if (auditId) loadForgingAuditDetail();
  }, [auditId]);






  const [writer, setWriter] = useState("");
  const [usDate, setUsDate] = useState("");  // YYYY-MM-DD
  const getPeriod = (dateStr) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let period = "";

    if (day <= 10) period = "초";
    else if (day <= 20) period = "중순";
    else period = "말";

    return `${month}월 ${period}`;
  };

  const getKoreanMonthLabel = (dateStr) => {
    if (!dateStr) return "실사자료"; // 날짜 없으면 기본값
    const d = new Date(dateStr);
    const year = d.getFullYear() % 100;
    const month = d.getMonth() + 1;
    return `${year}년 ${month}월 실사자료`;
  };



  /* ===============================
      🔶 상태값
  =============================== */
  const [targetStock, setTargetStock] = useState(30000);
  // 🔹 1) 운항중 합계 자동 계산



  // 🔹 2) 정상재고 자동 계산 (기존재고 - 불량)
  const updateNormalStock = () => {
    setItems(prev =>
      prev.map(it => ({
        ...it,
        normalStock: Number(it.overStock) - Number(it.defect || 0)
      }))
    );
  };




  /* ===============================
      🔶 엑셀 과부족 판정 수식 그대로 (D6 = 기준재고초과)
  =============================== */
  const judgeStatus = (d6, d4) => {
    if (d6 >= d4 * 1.13) return "초과";
    if (d6 >= d4 && d6 > d4 * 0.96) return "양호";
    if (d6 <= d4 * 0.7) return "위험";
    return "적정재고미달";
  };

  /* ===============================
      🔶 엑셀 가감필요횟수 수식 그대로
  =============================== */
  const calcAdjust = (d6, d4, unit) => {
    const diff = (d6 - d4) / unit;
    if (diff <= 0.7) return -Math.ceil(diff);
    return -Math.floor(diff);
  };

  /* ===============================
      🔶 운송 스케줄 row
  =============================== */
  const [rows, setRows] = useState([]);


  useEffect(() => {
    if (!rows.length || !items.length) return;

    const newItems = items.map(it => ({
      ...it,
      running: 0
    }));

    rows.forEach(row => {
      if (row.status !== "운항중") return;

      newItems.forEach(item => {
        const qty = row.quantities?.[item.itemCode] || 0;
        item.running += qty;
      });
    });

    setItems(newItems);
  }, [rows]);



  /* ===============================
      🔶 month 자동 계산
  =============================== */
  // 숫자에 콤마( , ) 붙여서 예쁘게 보여주는 함수
  const fmt = (n) => {
    if (n === null || n === undefined || n === "") return "";
    return Number(n).toLocaleString("en-US");
  };

  // 운항여부 스타일 함수
  const getStatusStyle = (status) => {
    if (status === "입고완료") {
      return {
        bgcolor: "#d9f7be",   // 연두배경
        color: "#237804",     // 초록글씨
        fontWeight: "bold",
        borderRadius: "6px",
        px: 1
      };
    }

    if (status === "운항중") {
      return {
        bgcolor: "#ffe6f1",   // 분홍배경
        color: "#c41d7f",     // 빨간글씨
        fontWeight: "bold",
        borderRadius: "6px",
        px: 1
      };
    }

    return {};
  };



  return (

    <Box sx={{ p: 3 }}>
      {/* ← 메인으로 버튼 */}
      <Box sx={{ mb: -4 }}>
        <Button
          variant="outlined"
          onClick={() => navigate("/")}
          sx={{
            borderColor: "#0069a6ff",     // 갈색 테두리
            color: "#0056a6ff",           // 텍스트 색
            backgroundColor: "#ffffff", // 흰색 배경
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

      {/* 🔥 저장 버튼 (DB 저장) */}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, gap: 1 }}>
        {/* 🔧 수정모드 버튼 */}
        <Button
          variant="outlined"
          onClick={() => setEditMode(!editMode)}
          sx={{
            borderColor: editMode ? "#d32f2f" : "#1976d2",
            color: editMode ? "#d32f2f" : "#1976d2",
            fontWeight: "bold"
          }}
        >
          {editMode ? "수정모드 종료" : "수정모드 활성화"}
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!editMode}
          onClick={async () => {
            const formattedUsDate = usDate ? new Date(usDate).toISOString().split("T")[0] : null;

            try {
              // ✅ forging_audit 자체를 업데이트
              await apiFetch(`${API_BASE}/api/forging-audits/${auditId}`, {
                method: "PUT",
                body: JSON.stringify({
                  writer,
                  target_stock: targetStock,
                  us_date: formattedUsDate
                })
              });



              const cleanRows = rows.map(normalizeRow);

              // 3) schedule_rows 저장 ← 여기 핵심!!
              await apiFetch(`${API_BASE}/api/schedule-row/bulk`, {
                method: "POST",
                body: JSON.stringify({
                  audit_id: auditId,
                  rows: cleanRows
                })
              });


              alert("저장 완료되었습니다!");
            } catch (e) {
              console.error(e);
              alert("저장 실패!");
            }
          }}
        >
          저장
        </Button>
      </Box>


      {/* 작성자 + 북미 날짜 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 1 }}>

        {/* 작성자 */}
        <TextField
          label="작성자"
          InputProps={{
            readOnly: !editMode,
            sx: {
              "& input": {
                fontSize: "14px",        // 입력 글자 크기
                fontWeight: "bold",      // 입력 Bold
              }
            }
          }}
          InputLabelProps={{
            shrink: true,
            sx: {
              fontSize: "15px",          // 라벨 크기
              fontWeight: "bold"         // 라벨 Bold
            }
          }}
          size="small"
          value={writer}
          onChange={(e) => {
            if (!editMode) return;
            setWriter(e.target.value);
          }}
          sx={{ width: 160 }}
        />

        {/* 북미 날짜 */}
        <TextField
          label="북미 기준 날짜 (YYYY-MM-DD)"
          size="small"
          placeholder="2025-11-03"
          value={usDate}
          InputProps={{
            readOnly: !editMode,
            sx: {
              "& input": {
                fontSize: "14px",        // 입력 글씨 크기
                fontWeight: "bold",      // Bold
              }
            }
          }}
          InputLabelProps={{
            shrink: true,
            sx: {
              fontSize: "15px",          // 라벨 글씨 크기
              fontWeight: "bold"         // Bold
            }
          }}
          onChange={(e) => {
            if (!editMode) return;
            setUsDate(e.target.value);
          }}
          sx={{ width: 200 }}
        />

      </Box>


      {/* ======================
    페이지 제목 + 토글 버튼
======================= */}
      <Box sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3
      }}>

        {/* 제목 */}
        <Typography variant="h5" sx={{ fontSize: 18, fontWeight: "bold" }}>
          원소재 재고 파악 및 운송일정 관리
          ({usDate ? getPeriod(usDate) : "작성일자"})
        </Typography>

        {/* 🔥 우측 상단 토글 버튼 */}
        <Button
          size="small"
          variant="outlined"
          onClick={() => setShowStockPanel(prev => !prev)}
          sx={{
            fontSize: "14px",
            fontWeight: "bold",
            mb: -1,
            mt: 2,
          }}
        >
          {showStockPanel ? "− 접기" : "+ 과부족 상태표 보기"}
        </Button>

      </Box>



      {/* 과부족 상태 패널 (T 제외 → 4개만 출력) */}

      {showStockPanel && (

        <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, mb: 1, gap: 1 }}>
            <Button
              variant="contained"
              color="success"
              size="small"
              disabled={!editMode}
              onClick={() =>
                setItems(prev => [
                  ...prev,
                  {
                    id: uuidv4(),
                    itemCode: "",
                    itemName: "",
                    overStock: 0,
                    defect: 0,
                    normalStock: 0,
                    running: 0,
                    unit: 0,
                  }
                ])
              }
            >
              + 품목추가
            </Button>

            <Button
              variant="contained"
              color="error"
              size="small"
              disabled={!editMode}
              onClick={() =>
                setItems(prev => (prev.length > 1 ? prev.slice(0, -1) : prev))
              }
            >
              - 품목삭제
            </Button>
          </Box>

          {/* 🔥 가로 한 줄, 왼쪽 정렬 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,   // ← 제목과 기준 사이 간격
              mb: 2
            }}
          >
            {/* 왼쪽: 제목 */}
            <Typography sx={{ fontWeight: "bold", fontSize: "18px" }}>
              ※ 과부족 상태 ※
            </Typography>

            {/* 오른쪽: 적정재고 기준 (제목 바로 옆) */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: "15px", fontWeight: "bold", color: "#777" }}>
                적정재고 기준:
              </Typography>


              {editMode ? (
                <TextField
                  type="number"
                  size="small"
                  value={targetStock}
                  onChange={(e) => setTargetStock(Number(e.target.value))}
                  sx={{
                    width: 120,
                    "& input": {
                      textAlign: "center",
                      fontWeight: "bold",
                      color: "#777",
                    },
                  }}
                />
              ) : (
                <Typography sx={{ fontSize: "17px", fontWeight: "bold", color: "#777" }}>
                  {fmt(targetStock)}
                </Typography>
              )}


            </Box>
          </Box>


          <Table size="small">
            <TableHead sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000" }}>
              <TableRow>
                {[
                  "품번",
                  "품목",
                  getKoreanMonthLabel(usDate),   // 예: 25년 11월 실사자료
                  "불량/발청 소재",
                  "적정재고",
                  "운항중",
                  "기존재고-불량",
                  "운항중+정상재고",
                  "판정"
                ].map(h => (
                  <TableCell
                    key={h}
                    align="center"
                    sx={{ fontWeight: "bold", fontSize: 14 }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {items.map((it, idx) => {
                const normal = it.normalStock;
                const after = it.running + normal;
                const status = judgeStatus(normal, targetStock);

                return (
                  <TableRow key={idx}
                    sx={{
                      backgroundColor: status === "적정재고미달" ? "#faeaea" : "inherit",
                    }}>


                    <TableCell
                      align="center"
                      onClick={() => {
                        if (!editMode) return;
                        setTargetItemIndex(idx);
                        setItemDialogOpen(true);
                      }}
                    >
                      {editMode ? (
                        <TextField
                          variant="outlined"
                          size="small"
                          value={it.itemCode}
                          placeholder="품번 선택"
                          InputProps={{
                            readOnly: true,
                          }}
                          sx={{
                            width: "100%",
                            "& .MuiOutlinedInput-root": {
                              height: 32,              // ⭐ 행 높이 고정
                              paddingRight: 0,
                              cursor: "pointer",
                            },
                            "& .MuiOutlinedInput-input": {
                              padding: "6px 8px",      // ⭐ 내부 여백 고정
                              textAlign: "center",
                              fontWeight: "bold",
                              fontSize: 14,
                            },
                          }}
                        />


                      ) : (
                        <Typography sx={{ fontWeight: "bold" }}>
                          {it.itemCode || "-"}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell
                      align="center"
                      onClick={() => {
                        if (!editMode) return;
                        setTargetItemIndex(idx);
                        setItemDialogOpen(true);
                      }}
                    >
                      {editMode ? (
                        <TextField
                          variant="outlined"
                          size="small"
                          value={it.itemName}
                          placeholder="품목 선택"
                          InputProps={{
                            readOnly: true,
                          }}
                          sx={{
                            width: "100%",
                            "& .MuiOutlinedInput-root": {
                              height: 32,              // ⭐ 동일
                              cursor: "pointer",
                            },
                            "& .MuiOutlinedInput-input": {
                              padding: "6px 8px",
                              textAlign: "center",
                              fontWeight: "bold",
                              fontSize: 14,
                            },
                          }}
                        />


                      ) : (
                        <Typography>{it.itemName || "-"}</Typography>
                      )}
                    </TableCell>



                    {/* 실사자료 수량 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                      {editMode ? (
                        <TextField
                          type="number"
                          variant="standard"
                          value={it.overStock}
                          onChange={(e) => {
                            const v = Number(e.target.value);

                            setItems(prev =>
                              prev.map((p, i) =>
                                i === idx ? { ...p, overStock: v } : p
                              )
                            );

                            updateNormalStock();
                          }}
                          sx={{
                            width: 80,
                            "& input": {
                              textAlign: "center",
                              fontSize: 15,
                              fontWeight: "bold",
                              color: "#1155cc"
                            }
                          }}
                        />
                      ) : (
                        fmt(it.overStock)
                      )}
                    </TableCell>

                    {/* 불량/발청 소재 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                      {editMode ? (
                        <TextField
                          type="number"
                          variant="standard"
                          value={it.defect}
                          onChange={(e) => {
                            const v = Number(e.target.value);

                            setItems(prev =>
                              prev.map((p, i) =>
                                i === idx ? { ...p, defect: v } : p
                              )
                            );

                            updateNormalStock();
                          }}
                          sx={{
                            width: 80,
                            "& input": {
                              textAlign: "center",
                              fontSize: 15,
                            }
                          }}
                        />
                      ) : (
                        fmt(it.defect)
                      )}
                    </TableCell>

                    {/* 적정재고 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                      {fmt(targetStock)}
                    </TableCell>

                    {/* 운항중 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                      {fmt(it.running)}
                    </TableCell>

                    {/* 기존재고 - 불량 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                      {fmt(normal)}
                    </TableCell>

                    {/* 운항중 + 정상재고 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                      {fmt(after)}
                    </TableCell>

                    {/* 판정 */}
                    <TableCell align="center">
                      <Box sx={getForgingJudgeStyle(status)}>
                        {status}
                      </Box>
                    </TableCell>

                  </TableRow>
                );
              })}
            </TableBody>


          </Table>
        </Paper>
      )}
      {/* ===============================
    🔶 과부족 아래 전체 (요구사항 반영 완성본)
=============================== */}
      <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
        {/* 제목 영역 */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: "bold", fontSize: "18px", mt: 1 }}>
            ※ 운송 스케줄 현황 ※
          </Typography>
        </Box>

        {/* 🔹 엑셀 ROUNDUP 구현 */}
        {(() => {
          window.excelRoundUp = (v) => (v >= 0 ? Math.ceil(v) : -Math.ceil(Math.abs(v)));
          return null;
        })()}

        {/* 🔹 가감필요 계산 */}
        {(() => {
          window.calcAdjustExcel = (real, target, unit) => {
            const diff = (real - target) / unit;
            return diff <= 0.7 ? -window.excelRoundUp(diff) : -Math.floor(diff);
          };
          return null;
        })()}


        {/* ===============================  
      🔶 행추가 버튼  
  =============================== */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, mb: 1, gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            size="small"
            disabled={!editMode}   // ⭐ 추가
            onClick={() =>
              setRows((prev) => [
                ...prev,
                {
                  id: uuidv4(),
                  inv_no: "",
                  no: "",
                  status: "",
                  etd: "",
                  eta: "",
                  month_depart: "",
                  month_arrive: "",
                  quantities: {} // key = itemCode
                },
              ])
            }
          >
            + 행추가
          </Button>

          {/* 🔥 행삭제(마지막 행 삭제 버튼) */}
          <Button
            variant="contained"
            color="error"
            size="small"
            disabled={!editMode}

            onClick={() =>
              setRows((prev) => {
                if (prev.length === 0) return prev;

                const newRows = prev.slice(0, -1);



                return newRows;
              })
            }
          >
            - 행삭제
          </Button>
        </Box>

        {/* ===============================  
      🔶 3단: 운송 스케줄 테이블  
  =============================== */}
        <Table size="small" sx={{ mt: 1, borderCollapse: "collapse" }}>
          <TableHead sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000" }}>
            <TableRow>
              <TableCell align="center">INV#</TableCell>
              <TableCell align="center">NO</TableCell>
              <TableCell align="center">운항여부</TableCell>

              {/* ⭐ 품목명 헤더 */}
              {scheduleItems.map(it => (
                <TableCell
                  key={it.itemCode}
                  align="center"
                  sx={{ fontWeight: "bold", fontSize: "14px" }}
                >
                  {it.itemName}
                </TableCell>
              ))}

              <TableCell align="center">ETD</TableCell>
              <TableCell align="center">ETA</TableCell>
              <TableCell align="center">선적월</TableCell>
              <TableCell align="center">도착월</TableCell>
            </TableRow>
          </TableHead>


          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>

                {/* 🔹 INV 입력 → 자동 매핑 */}
                <TableCell align="center">
                  <TextField
                    variant="standard"
                    value={row.inv_no || ""}

                    /* ✅ 1️⃣ 입력만 처리 */
                    onChange={(e) => {
                      if (!editMode) return;

                      const inv = e.target.value;

                      setRows(prev =>
                        prev.map(r =>
                          r.id === row.id ? { ...r, inv_no: inv } : r
                        )
                      );
                    }}

                    /* ✅ 2️⃣ 포커스 벗어날 때 한 번만 조회 */
                    onBlur={async (e) => {
                      if (!editMode) return;

                      const inv = e.target.value.trim();
                      if (!inv) return;

                      try {
                        const res = await apiFetch(`${API_BASE}/api/invoice/${inv}`);
                        const data = await res.json();

                        const etdDate = data?.etd ? parseKRDate(data.etd) : null;
                        const etaDate = data?.eta ? parseUSDate(data.eta) : null;
                        const today = todayUS();

                        let status = "";
                        if (!etaDate) status = "부산항 미입고";
                        else if (etaDate <= today) status = "입고완료";
                        else if (etdDate && etdDate > today) status = "선적대기중";
                        else status = "운항중";

                        // ⭐⭐⭐ 여기서 row 단위로 qty 로딩
                        const quantities = await loadRowQuantities(inv);

                        setRows(prev =>
                          prev.map(r =>
                            r.id === row.id
                              ? {
                                ...r,
                                inv_no: inv,
                                no: data?.no || "",
                                status,
                                etd: etdDate,
                                eta: etaDate,
                                month_depart: etdDate ? `${etdDate.getMonth() + 1}월` : "",
                                month_arrive: etaDate ? `${etaDate.getMonth() + 1}월` : "",
                                quantities, // ✅ row 전용
                              }
                              : r
                          )
                        );
                      } catch (e) {
                        console.error(e);
                      }
                    }}




                    sx={{
                      width: 160,
                      "& .MuiInputBase-input": {
                        fontSize: "14px",
                        fontWeight: "bold",
                        textAlign: "center"
                      }
                    }}
                  />

                </TableCell>

                {/* 🔹 NO → 직접 입력 가능 */}
                <TableCell align="center">
                  <TextField
                    InputProps={{ readOnly: !editMode }}
                    variant="standard"
                    value={row.no}
                    onChange={(e) => {
                      if (!editMode) return;
                      const v = e.target.value;
                      setRows((prev) =>
                        prev.map((r) =>
                          r.id === row.id ? { ...r, no: v } : r
                        )
                      );
                    }}
                    sx={{
                      width: 70,
                      "& .MuiInputBase-input": {
                        fontSize: "14px",
                        fontWeight: "bold",
                        textAlign: "center"   // ⭐ 이 위치가 가장 정확함!
                      }

                    }}
                  />
                </TableCell>

                {/* 🔹 운행여부 (자동만) */}
                <TableCell align="center">
                  <Box
                    sx={{
                      display: "inline-block",
                      ...getStatusStyle(row.status),
                    }}
                  >
                    {row.status}
                  </Box>
                </TableCell>

                {/* ⭐ Packing List 수량 컬럼 (이게 빠져 있었음) */}
                {scheduleItems.map(it => (
                  <TableCell
                    key={it.itemCode}
                    align="center"
                    sx={{ fontWeight: "bold", fontSize: "14px" }}
                  >
                    {row.quantities?.[it.itemCode] || ""}
                  </TableCell>
                ))}

                {/* 🔹 ETD (입력칸 제거, 자동 표시만) */}
                <TableCell align="center">
                  <Typography sx={{ fontWeight: "bold", fontSize: "15px" }}>
                    {row.etd ? formatKRDate(row.etd) : ""}


                  </Typography>
                </TableCell>

                {/* 🔹 ETA (입력칸 제거, 자동 표시만) */}
                <TableCell align="center">
                  <Box
                    sx={{
                      display: "inline-block",
                      ...getEtaStyle(row.status),
                      fontWeight: "bold",
                      fontSize: "15px",
                    }}
                  >
                    {row.eta ? row.eta.toISOString().split("T")[0] : ""}

                  </Box>
                </TableCell>



                {/* 🔹 선적월 & 도착월 */}
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  {row.month_depart}
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  {row.month_arrive}
                </TableCell>


              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>




      <ItemSearchDialog
        open={itemDialogOpen}
        onClose={() => {
          setItemDialogOpen(false);
          setTargetItemIndex(null);
        }}
        onSelect={handleSelectItem}
      />


    </Box>
  );
}
