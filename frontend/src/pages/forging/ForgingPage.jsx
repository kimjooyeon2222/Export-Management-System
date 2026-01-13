import React, { useState, useRef } from 'react';
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
  const stockBluePill = {
    display: "inline-block",
    px: 1.6,
    py: 0.45,
    borderRadius: "999px",
    bgcolor: "#d0e7ff",      // ⭐ 한 톤 더 진한 하늘색
    color: "#0d47a1",        // ⭐ 깊은 파랑 (텍스트 선명)
    fontWeight: "bold",
    fontSize: "14px",
    lineHeight: 1.2,
    textAlign: "center",
    border: "1px solid #90caf9" // ⭐ 경계 또렷
  };



  const invoiceCache = useRef({});
  const qtyCache = useRef({});


  async function hydrateRowByInv(row) {
    if (!row.inv_no) return row;

    // ✅ 이미 계산된 row면 스킵
    if (row._hydrated) return row;

    try {
      let data = invoiceCache.current[row.inv_no];
      if (!data) {
        const res = await apiFetch(`${API_BASE}/api/invoice/${row.inv_no}`);
        data = await res.json();
        invoiceCache.current[row.inv_no] = data;
      }

      const etdDate = data?.etd ? parseKRDate(data.etd) : null;
      const etaDate = data?.eta ? parseUSDate(data.eta) : null;
      const today = todayUS();

      let status = "";
      if (!etaDate) status = "부산항 미입고";
      else if (etaDate <= today) status = "입고완료";
      else if (etdDate && etdDate > today) status = "선적대기중";
      else status = "운항중";

      let quantities = qtyCache.current[row.inv_no];
      if (!quantities) {
        quantities = await loadRowQuantities(row.inv_no);
        qtyCache.current[row.inv_no] = quantities;
      }

      return {
        ...row,
        status,
        etd: etdDate,
        eta: etaDate,
        month_depart: etdDate ? `${etdDate.getMonth() + 1}월` : "",
        month_arrive: etaDate ? `${etaDate.getMonth() + 1}월` : "",
        quantities,
        _hydrated: true // ⭐ 핵심
      };
    } catch (e) {
      console.error("❌ hydrate 실패:", row.inv_no, e);
      return row;
    }
  }



  async function fetchInvItemQty(inv_no, itemCode, itemName) {
    const res = await apiFetch(`${API_BASE}/api/forging/inv-item-qty`, {

      method: "POST",
      body: JSON.stringify({
        inv_no,
        item_code: itemCode,

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

  const applyStockAuditToItems = async (baseItems) => {
    if (!usDate || !baseItems.length) return baseItems;

    const res = await apiFetch(
      `${API_BASE}/api/stock-audit/forging/by-date/${usDate}`
    );
    const auditItems = await res.json();

    if (!auditItems.length) return baseItems;

    const auditMap = {};
    auditItems.forEach(a => {
      auditMap[a.item_no] = a;
    });

    return baseItems.map(it => {
      const audit = auditMap[it.itemCode];
      if (!audit) return it;

      const overStock = Number(audit.audit_qty || 0);
      const defect = Number(audit.defect_total || 0);
      const optimalStock = Number(audit.optimal_qty || 0);

      return {
        ...it,
        overStock,
        defect,
        normalStock: overStock - defect,
        optimalStock
      };
    });
  };


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


  const scheduleSignature = scheduleItems
    .map(it => it.itemCode)
    .join("|");



  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [targetItemIndex, setTargetItemIndex] = useState(null);
  const handleSelectItem = async (item) => {
    if (targetItemIndex === null) return;

    const nextItems = items.map((it, idx) =>
      idx === targetItemIndex
        ? {
          ...it,
          itemCode: item.item_no,
          itemName: item.item_name,
          unit: item.box_qty || 0,
        }
        : it
    );

    console.log("✅ 선택 직후 nextItems", nextItems);
    console.log("✅ usDate", usDate);

    setItems(nextItems);

    if (usDate) {
      const withAudit = await applyStockAuditToItems(nextItems);
      console.log("✅ 실사 반영 후 items", withAudit);
      setItems(withAudit);
    }
  };

  const { auditId: paramAuditId } = useParams();
  const [auditId, setAuditId] = useState(paramAuditId || null);

  useEffect(() => {
    if (auditId) return; // 이미 있으면 스킵

    async function loadLatestAudit() {
      const res = await apiFetch(
        `${API_BASE}/api/forging-audits/latest`
      );
      const data = await res.json();

      if (data?.id) {
        setAuditId(data.id);
      }
    }

    loadLatestAudit();
  }, []);

  const getForgingJudgeStyle = (status) => {
    switch (status) {
      case "초과":
        return {
          bgcolor: "#fff2cc",     //  연노랑
          color: "#7f6000",       //  갈색
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

      // ✅ forging_audit는 "기준 날짜"만 관리
      setUsDate(data.us_date || "");
      setWriter(data.writer || "");


      // ✅ items는 여기서 세팅 ❌
      setItems(
        (data.forging_items || []).map(it => ({
          id: uuidv4(),
          itemCode: it.itemCode,
          itemName: it.itemName,
          overStock: 0,
          defect: 0,
          normalStock: 0,
          optimalStock: 0,
          running: 0,
          unit: 0,
        }))
      );


      // 운송 스케줄만 복원
      const parsedRows = (data.rows || []).map(r => ({
        ...r,
        quantities: r.quantities || {},
        etd: r.etd ? parseKRDate(r.etd) : null,
        eta: r.eta ? parseUSDate(r.eta) : null,
        status: r.status || ""
      }));

      setRows(parsedRows);
    }

    if (auditId) loadForgingAuditDetail();
  }, [auditId]);


  const [writer, setWriter] = useState("");
  const [usDate, setUsDate] = useState("");  // YYYY-MM-DD
  const itemSignature = items
    .map(it => it.itemCode)
    .join("|");


  useEffect(() => {
    if (!usDate || !items.length) return;

    console.log("🔥 실사자료 반영 (품번 변경 감지)", usDate, items);

    let cancelled = false;

    (async () => {
      const withAudit = await applyStockAuditToItems(items);
      if (!cancelled) {
        setItems(withAudit);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [usDate, itemSignature]);

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
    if (!dateStr) return "실사재고"; // 날짜 없으면 기본값
    const d = new Date(dateStr);
    const year = d.getFullYear() % 100;
    const month = d.getMonth() + 1;
    return `${year}년 ${month}월 실사재고`;
  };


  /* ===============================
      🔶 상태값
  =============================== */

  // 🔹 1) 운항중 합계 자동 계산







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
      🔶 운송 스케줄 row
  =============================== */
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!rows.length) return;
    if (!scheduleItems.length) return; // ⭐ qty 계산 때문에 필요

    let cancelled = false;

    (async () => {
      const hydrated = await Promise.all(
        rows.map(r => hydrateRowByInv(r))
      );

      if (!cancelled) {
        setRows(hydrated);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scheduleSignature]);

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
                  us_date: formattedUsDate
                })
              });
              // 2️ forging_item (🔥 추가)
              await apiFetch(`${API_BASE}/api/forging-items/bulk`, {
                method: "POST",
                body: JSON.stringify({
                  audit_id: auditId,
                  items: items
                })
              });
              const cleanRows = rows

              // 3) schedule_rows 저장 ← 여기 핵심!!
              await apiFetch(`${API_BASE}/api/schedule-row/bulk`, {
                method: "POST",
                body: JSON.stringify({
                  audit_id: auditId,
                  rows: cleanRows
                })
              });


              alert("저장 완료되었습니다!");
              setEditMode(false);
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
          placeholder="YYYY-MM-DD"
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

          {/* ✅ 제목 영역 — 운송 스케줄 현황과 동일 */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: "bold", fontSize: "18px", mt: 1 }}>
              ※ 과부족 상태 ※
            </Typography>


          </Box>

          {/* ✅ 버튼 영역 — 운송 스케줄 현황과 완전히 동일 */}
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




          <Table size="small">
            <TableHead sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000" }}>
              <TableRow
                sx={{
                  height: 56,            // ⭐ 헤더 행 높이 고정 (중요)
                }}
              >
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                  품번
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                  품목
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                  {getKoreanMonthLabel(usDate)}
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                  불량/발청 소재
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                  <Box sx={{ lineHeight: 1.2 }}>
                    적정재고
                    <Typography
                      component="div"
                      sx={{ fontSize: 13, fontWeight: "bold", color: "#555" }}
                    >
                      (3개월)
                    </Typography>
                  </Box>
                </TableCell>


                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    fontSize: 15,
                    padding: "6px 4px",
                  }}
                >
                  <Box
                    sx={{
                      display: "inline-block",
                      ...getStatusStyle("운항중"),
                    }}
                  >
                    운항중
                  </Box>
                </TableCell>


                {/* 🔥 문제의 컬럼 — 이렇게 써야 함 */}
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    fontSize: 15,
                    padding: "6px 4px",
                  }}
                >
                  {/* 🔵 기존재고-불량 pill */}
                  <Box sx={stockBluePill}>
                    정상재고
                  </Box>

                  {/* 🔹 아래 설명 */}
                  <Typography
                    sx={{
                      fontSize: "15px",
                      color: "#555",
                      lineHeight: 1.1,
                      mt: 0.2,
                      fontWeight: "bold"
                    }}
                  >
                    (실사재고-불량/발청)
                  </Typography>
                </TableCell>


                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    fontSize: 15,
                    padding: "6px 4px",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.6,
                      flexWrap: "nowrap",
                    }}
                  >
                    {/* 🔴 운항중 pill (본문/헤더와 동일) */}
                    <Box
                      sx={{
                        display: "inline-block",
                        ...getStatusStyle("운항중"),


                      }}
                    >
                      운항중
                    </Box>

                    <Typography sx={{ fontWeight: "bold", fontSize: "15px" }}>
                      +
                    </Typography>

                    {/* 🔵 정상재고 pill */}
                    <Box sx={stockBluePill}>
                      정상재고
                    </Box>
                  </Box>
                </TableCell>


                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                  <Box sx={{ lineHeight: 1.2 }}>
                    판정
                    <Typography
                      component="div"
                      sx={{ fontSize: 13, fontWeight: "bold", color: "#555" }}
                    >
                      (실사재고 기준)
                    </Typography>
                  </Box>
                </TableCell>

              </TableRow>
            </TableHead>


            <TableBody>
              {items.map((it, idx) => {
                const normal = it.normalStock;
                const after = it.running + normal;
                const status = judgeStatus(
                  normal,
                  it.optimalStock
                );

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
                        <Typography sx={{ fontWeight: "bold", fontSize: "15px" }}>
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
                        <Typography sx={{ fontWeight: "bold" }}>{it.itemName || "-"}</Typography>
                      )}
                    </TableCell>



                    {/* 실사자료 수량 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                      {fmt(it.overStock)}
                    </TableCell>


                    {/* 불량/발청 소재 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                      {fmt(it.defect)}
                    </TableCell>


                    {/* 적정재고 */}
                    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: 15 }}>
                      {fmt(it.optimalStock)}
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
              <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>INV#</TableCell>
              <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>NO</TableCell>
              <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>운항여부</TableCell>

              {/* ⭐ 품목명 헤더 */}
              {scheduleItems.map(it => (
                <TableCell
                  key={it.itemCode}
                  align="center"
                  sx={{ fontWeight: "bold", fontSize: "15px" }}
                >
                  {it.itemName}
                </TableCell>
              ))}

              <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>ETD</TableCell>
              <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>ETA</TableCell>
              <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>선적월</TableCell>
              <TableCell align="center" sx={{ fontSize: "15px", fontWeight: "bold" }}>도착월</TableCell>
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
                        fontSize: "15px",
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
                    sx={{ fontWeight: "bold", fontSize: "15px" }}
                  >
                    {fmt(row.quantities?.[it.itemCode])}
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
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                  {row.month_depart}
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
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
