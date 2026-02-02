import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from "uuid";
import { useRef } from "react";
import { apiFetch } from "api/apiFetch";

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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";


// 수출자 - 품목 매핑
const exporterToItems = {
  모텍: ['EV-SUB', 'TOOL', '설비'],
  오토텍: ['EV-SUB', 'TOOL', '건설자재', '설비', '오일'],
  이엔지: ['TOOL', '단조소재', '설비'],
  정공: ['TOOL', '건설자재', '설비']
};

// 품목 - 수출자 매핑 (역방향)
const itemToExporters = {
  'EV-SUB': ['모텍', '오토텍'],
  TOOL: ['모텍', '오토텍', '이엔지', '정공'],
  건설자재: ['오토텍', '정공'],
  단조소재: ['이엔지'],
  설비: ['모텍', '오토텍', '이엔지', '정공'],
  오일: ['오토텍']
};




export default function InvoicePage() {
  const [editingItemValue, setEditingItemValue] = useState("");
  const [editingItemRowId, setEditingItemRowId] = useState(null);
  const [customItemValue, setCustomItemValue] = useState("");

  const ITEM_TYPES = ["EV-SUB", "TOOL", "건설자재", "단조소재", "설비", "오일"];

  function renderMultiline(val) {
    return (val || "").replace(/@/g, "\n");
  }

  function displayShortDate(dateStr) {
    if (!dateStr) return "";
    // YYYY-MM-DD → YY-MM-DD
    return dateStr.length >= 10 ? dateStr.slice(2) : dateStr;
  }

  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
  }, []);


  function parseUSDate(str) {
    if (!str) return null;
    const [y, m, d] = str.split("-").map(Number);
    // 미국 Chicago 기준 00시 = UTC+6
    return new Date(Date.UTC(y, m - 1, d, 6, 0, 0));
  }




  const [refreshTick, setRefreshTick] = useState(0);   // ← 반드시 추가!

  // 🔥 타입별 placeholder 매핑
  const placeholderMap = {
    po: "PO 번호 입력",
    part: "품번 입력",
    name: "품명 입력",
    inv: "INV 번호 입력",
    vendor: "거래처 입력"

  };




  const [searchType, setSearchType] = useState("po");

  const [sortMode, setSortMode] = useState(false);

  // 👉 드래그 시작 감지 센서
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    })
  );

  // 👉 드래그 종료 시 순서 변경 함수
  // ⭐ 행 정렬 저장 handleDragEnd (DB 업데이트 버전)
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 🔥 전체 rows 기준으로 index 찾아야 반영됨
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);

    const newRows = arrayMove([...rows], oldIndex, newIndex);

    // sort_order 재배치
    const updatedSort = newRows.map((row, idx) => ({
      id: row.id,
      sort_order: idx + 1
    }));

    // 화면 업데이트
    setRows(newRows);

    // DB 저장
    await apiFetch(`${API_BASE}/api/invoices/sort`, {
      method: "PUT",
      body: JSON.stringify(updatedSort),
    });
  };




  const bottomScrollRef = useRef(null);
  const scrollToBottom = () => {
    if (bottomScrollRef.current) {
      bottomScrollRef.current.scrollTop = bottomScrollRef.current.scrollHeight;
    }
  };
  function SortableRow({ row, children, rowBg, sortMode }) {
    if (!sortMode) {
      // 🔥 sortMode OFF → 일반 TableRow 사용 (useSortable 절대 실행 안 됨)
      return (
        <TableRow style={{ backgroundColor: rowBg }}>
          {children}
        </TableRow>
      );
    }

    // 🔥 sortMode ON일 때만 useSortable 작동
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: row.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      backgroundColor: rowBg,
      cursor: "grab",
    };

    return (
      <TableRow
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        {children}
      </TableRow>
    );
  }


  const [etdStart, setEtdStart] = useState("");
  const [etaEnd, setEtaEnd] = useState("");


  const navigate = useNavigate();
  const [poNumber, setPoNumber] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showUpcoming, setShowUpcoming] = useState(true);
  // === 상단에 추가 ===
  const [isEditMode, setIsEditMode] = useState(false);
  // 🔥 삭제 모드
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedInvs, setSelectedInvs] = useState([]);

  // 현재 선택된 수출자 / 품목
  const [selectedExporter, setSelectedExporter] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectionPriority, setSelectionPriority] = useState(null); // ✅ 누가 먼저 눌렸는지 저장

  const today = new Date();
  const getDateOffset = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const API_BASE = import.meta.env.VITE_API_URL;

  function parseKRDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, -9, 0, 0));  // 한국 00시 고정
  }



  // 기본 데이터
  const [rows, setRows] = useState([]);
  useEffect(() => {
    apiFetch(`${API_BASE}/api/invoices`)
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => a.sort_order - b.sort_order);
        setRows(sorted);
      })
      .catch(err => console.error("Invoice API Error:", err));
  }, []);



  useEffect(() => {
    if (!isEditMode) {
      scrollToBottom();
    }
  }, [rows, isEditMode]);   // ← isEditMode도 dependency로 추가

  const todayUS = React.useMemo(() => {
    // 한국 시간이 아니라 미국 시간으로 변환
    const nowUS = new Date().toLocaleString("en-US", {
      timeZone: "America/Chicago"
    });

    const d = new Date(nowUS);
    d.setHours(0, 0, 0, 0);   // ⭐ 미국 기준 "오늘 00:00"
    return d;
  }, [rows, etdStart, etaEnd, showUpcoming]);


  // CRUD 기능

  const handleAdd = async () => {
    const maxId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) : 0;

    const newRow = {
      id: maxId + 1, // 🔥 새 ID 직접 생성
      exporter: "신규",
      inv_no: `INV-${uuidv4().slice(0, 8)}`, // 🔥 유니크 생성
      amount: "$0.00",
      item_type: "NEW ITEM",
      cont_no: "NEW-CONT",
      bl_no: "NEW-BL",
      etd: getDateOffset(0),
      eta: getDateOffset(2),
      delayed_date: getDateOffset(2),
      count_days: "0일",
      needs_help: "X",
      remark: "신규"
    };

    const res = await apiFetch(`${API_BASE}/api/invoices`, {
      method: "POST",
      body: JSON.stringify(newRow),
    });

    const saved = await res.json();
    setRows(prev => [...prev, saved]);
  };



  const handleEdit = async (id, field, value) => {
    // 1) 프론트 화면 업데이트
    setRows(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );

    // 2) 서버(DB)에 업데이트 요청
    await apiFetch(`${API_BASE}/api/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify({ [field]: value })
    });
  };




  const handleSearch = async () => {
    const allPacking = await apiFetch(`${API_BASE}/api/packing`).then(r => r.json());
    const allInvoice = await apiFetch(`${API_BASE}/api/invoices`).then(r => r.json());

    if (!poNumber.trim()) {
      alert("검색어를 입력하세요.");
      return;
    }

    // 🔹 입력값 정규화
    const raw = poNumber.trim();

    const input =
      searchType === "name" || searchType === "vendor"
        ? raw.toLowerCase().replace(/\s+/g, "").replace(/[^가-힣a-z0-9]/g, "")
        : raw.replace(/[^0-9A-Za-z]/g, "").toLowerCase();

    // 🔥 반드시 필요
    if (!input) {
      alert("유효한 검색어를 입력하세요.");
      return;
    }

    let matchedPacking = [];

    // ===================================================
    // 🔥 1) PO 검색
    // ===================================================
    if (searchType === "po") {
      matchedPacking = allPacking.filter((r) => {
        const poValue = String(r.po_no || "")
          .trim()
          .replace(/[^0-9A-Za-z]/g, "")
          .toLowerCase();
        return poValue === input || poValue.includes(input);
      });
    }

    // ===================================================
    // 🔥 2) 품번 검색 (part_no 기준)
    // ===================================================
    else if (searchType === "part") {
      matchedPacking = allPacking.filter((r) => {
        const partValue = String(r.part_no || "")
          .trim()
          .replace(/[^0-9A-Za-z]/g, "")
          .toLowerCase();
        return partValue === input || partValue.includes(input);
      });
    }

    // =============================
    // 🔥 3) 품명(part_name) 검색 — (한글도 포함)
    // =============================
    else if (searchType === "name") {
      matchedPacking = allPacking.filter((r) => {
        const nameValue = (r.part_name || "")
          .toLowerCase()
          .replace(/[^0-9a-z가-힣]/g, "");   // ⭐ 하이픈, 공백, 특수문자 제거

        return nameValue.includes(input);
      });
    }


    // =============================
    // 🔥 4) INV# 자체 검색
    // =============================
    else if (searchType === "inv") {
      const rawInput = poNumber.trim().toLowerCase();   // ⭐ 하이픈 제거하지 않음

      const matchedInvs = allInvoice.filter((i) =>
        (i.inv_no || "").toLowerCase().includes(rawInput)
      );

      matchedPacking = allPacking.filter((p) =>
        matchedInvs.some(inv => inv.inv_no === p.inv_no)
      );
    }
    // ===================================================
    // 🔥 5) 거래처 검색 (packing_list.vendor 기준)
    // ===================================================
    else if (searchType === "vendor") {
      const rawInput = poNumber.trim().toLowerCase();

      matchedPacking = allPacking.filter((p) => {
        const vendorValue = (p.vendor || "").toLowerCase();
        return vendorValue.includes(rawInput);
      });

      // vendor 검색 시에도 invoice 데이터 매칭
      matchedPacking = matchedPacking.map((p) => {
        const invMatch = allInvoice.find((i) => i.inv_no === p.inv_no);
        return { ...p, ...invMatch };
      });

      // INV 중복 제거
      matchedPacking = matchedPacking.filter(
        (item, index, self) =>
          index === self.findIndex((r) => r.inv_no === item.inv_no)
      );
    }



    // 검색 결과 없으면
    if (matchedPacking.length === 0) {
      alert("❌ 검색 결과가 없습니다.");
      setSearchResult(null);
      return;
    }


    // 🔹 invoice 데이터와 병합 (INV 기준)
    const mergedResults = matchedPacking.map((p) => {
      const invMatch = allInvoice.find((i) => i.inv_no === p.inv_no);
      return { ...p, ...invMatch };
    });

    // INV 중복 제거
    const uniqueByInv = mergedResults.filter(
      (item, index, self) => index === self.findIndex((r) => r.inv_no === item.inv_no)
    );

    setSearchResult(uniqueByInv);
  };

  // 🔥 한국식 날짜("11월 06일") → YYYY-MM-DD 변환
  const normalizeDate = (str) => {
    if (!str) return null;

    // 이미 YYYY-MM-DD 형태라 Date.parse 가능하면 그대로 통과
    if (!isNaN(Date.parse(str))) return str;

    // "11월 06일" 패턴 잡기
    const match = str.match(/(\d{1,2})월\s*(\d{1,2})일/);
    if (!match) return null;

    const month = match[1].padStart(2, "0");
    const day = match[2].padStart(2, "0");

    const year = new Date().getFullYear();
    return `${year}-${month}-${day}`;
  };



  // 필터링 로직 (수출자 / 품목 버튼 반영)
  let filteredRows = rows.filter((r) => {


    // 기본조건: showUpcoming (5일 이내 필터링)
    if (showUpcoming) {
      // 🔥 delayed_date가 있으면 그 날짜로 필터링
      const baseDate = r.delayed_date
        ? parseUSDate(normalizeDate(r.delayed_date))
        : parseUSDate(normalizeDate(r.eta));

      const daysToArrival = Math.floor((baseDate - todayUS) / (1000 * 60 * 60 * 24));


      // 🔥 오늘 이후 ~ 5일 전까지 포함
      if (!(daysToArrival >= 0)) return false;
    }



    // --- 날짜 필터링 정확한 버전 ---
    // 기간 필터
    if (etdStart) {
      const etdDate = parseKRDate(normalizeDate(r.etd));   // 한국시간 00:00
      const startDate = parseKRDate(etdStart);

      if (etdDate < startDate) return false;
    }

    if (etaEnd) {
      const etaDate = parseUSDate(normalizeDate(r.eta));
      const endDate = parseUSDate(etaEnd);

      if (etaDate > endDate) return false;
    }




    // 버튼 조건: 선택된 수출자/품목 기준 필터
    if (selectedExporter && selectedItem) {
      // 둘 다 선택됨 → 교집합
      return r.exporter === selectedExporter && r.item_type === selectedItem;
    } else if (selectedExporter) {
      return r.exporter === selectedExporter;
    } else if (selectedItem) {
      return r.item_type === selectedItem;
    }

    // 아무 것도 선택 안했을 때 전체 표시
    return true;
  })
  // 금일 이후 도착분 버튼 켜졌을 때만 delayed_date 기준 정렬
  if (showUpcoming) {
    filteredRows = filteredRows.sort((a, b) => {
      const aDate = a.delayed_date
        ? parseUSDate(normalizeDate(a.delayed_date))
        : parseUSDate(normalizeDate(a.eta));

      const bDate = b.delayed_date
        ? parseUSDate(normalizeDate(b.delayed_date))
        : parseUSDate(normalizeDate(b.eta));

      return aDate - bDate;
    });
  }


  return (
    <Box sx={{ bgcolor: '#fff', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 타이틀 */}
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'black', fontSize: '1.1rem', pl: 3, pt: 2, mb: 1 }}>
        수출일정 통합관리부
      </Typography>

      {/* 헤더 */}
      <Box
        sx={{
          background: 'linear-gradient(180deg, #243447 0%, #1F2A37 100%)',
          color: '#E5E7EB',
          position: 'relative',
          py: 1.4,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
        }}
      >

        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          disableRipple
          sx={{
            color: '#E5E7EB',
            borderColor: 'rgba(255,255,255,0.4)',
            fontWeight: 600,
            fontSize: '0.8rem',
            textTransform: 'none',
            textDecoration: 'none !important',  // 🔥 링크 기본 파란 hover 제거

            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white !important',       // 🔥 글씨 파란색 뜨는 문제 해결
              borderColor: 'white',
              textDecoration: 'none',
            },

            // 클릭 후 파란 focus 제거
            '&:focus': {
              outline: 'none',
              color: 'white',
            },
            '&:active': {
              color: 'white',
            }
          }}
        >


          ← 메인으로
        </Button>

        {/* 중앙 검색창 */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              sx={{
                fontWeight: 600,
                color: '#E5E7EB',
                fontSize: '0.95rem',
                letterSpacing: '0.6px'
              }}
            >
              SHINHWA |
            </Typography>


            <Select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              size="small"
              sx={{
                bgcolor: "white",
                borderRadius: 1,
                height: "32px",
                fontWeight: "bold",
                '& .MuiSelect-select': {
                  padding: "4px 10px",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  color: "#333"
                }
              }}
            >
              <MenuItem value="po">PO</MenuItem>
              <MenuItem value="part">품번</MenuItem>
              <MenuItem value="name">품명</MenuItem>
              <MenuItem value="inv">INV#</MenuItem>
              <MenuItem value="vendor">거래처</MenuItem>

            </Select>
          </Box>

          <TextField
            variant="outlined"
            size="small"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder={placeholderMap[searchType]}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            sx={{
              bgcolor: 'white',
              borderRadius: 1,
              width: '240px',
              '& input': { fontSize: '1rem', fontWeight: 500 }
            }}
          />
          <Button
            variant="outlined"
            onClick={handleSearch}
            disableRipple
            disableFocusRipple
            sx={{
              color: '#E5E7EB',
              borderColor: 'rgba(255,255,255,0.4)', // ✅ 메인으로와 동일
              backgroundColor: 'rgba(255,255,255,0.18)', // 시인성만 보강
              fontWeight: 600,
              minWidth: 44,
              height: 36,

              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.18)', // 변화 없음
                borderColor: 'rgba(255,255,255,0.4)',     // ✅ 그대로
                color: '#E5E7EB',
              },

              '&:active': {
                backgroundColor: 'rgba(255,255,255,0.18)',
              },
              '&:focus': {
                backgroundColor: 'rgba(255,255,255,0.18)',
              }
            }}
          >
            🔍
          </Button>



        </Box>

      </Box>

      {/* 검색결과 + 수출자/품목 버튼 */}
      <Box sx={{ flex: '0 0 30%', display: 'flex', p: 2, gap: 2 }}>
        {/* 왼쪽 검색결과 */}
        <Box
          sx={{
            flex: 1.75,   // 높이 완전 고정
            flexShrink: 0,       // ❗ 절대로 줄어들지 않음
            border: '1px solid #ccc',
            borderRadius: 1,
            p: 2,
            overflowY: 'auto',

            maxHeight: '340px'


          }}
        >
          {searchResult && searchResult.length > 0 ? (
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                <TableRow>
                  {['수출자', 'INV#', 'CONT#', 'BL#', 'ETD', 'ETA', '공장 도착일', '상태'].map((col) => (
                    <TableCell key={col} align="center" sx={{ fontWeight: 'bold' }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {searchResult.map((row, i) => {

                  const merged = row;   // row 자체가 이미 invoice + packing 병합된 상태!



                  // 하단 표(Invoice Data)에서 delayed, eta, etd 값 불러오기
                  const etd = merged.etd || '-';
                  const eta = merged.eta || '-';
                  const delayed = merged.delayed_date || '-';




                  // === 도착 여부: delayed_date가 오늘 이전이면 무조건 도착 ===

                  // delayed_date 또는 ETA 중 실제 도착일 적용
                  const etaDate2 = parseUSDate(normalizeDate(merged.eta));

                  const delayedDate2 = merged.delayed_date
                    ? parseUSDate(normalizeDate(merged.delayed_date))
                    : etaDate2;

                  const arrived = delayedDate2 <= todayUS;




                  return (
                    <TableRow key={i}>
                      <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{merged.exporter || '-'}</TableCell>

                      {/* INV 클릭 시 PACKING LIST 이동 */}
                      <TableCell
                        align="center"
                        sx={{
                          whiteSpace: "nowrap",
                          minWidth: 160,
                          color: "blue",
                          cursor: "pointer",
                          textDecoration: "underline",
                          fontWeight: "bold"
                        }}
                        onClick={() => window.location.assign(`/packing-list/${merged.inv_no}`)}
                      >
                        {merged.inv_no}
                      </TableCell>


                      {/* 하단 표 데이터 그대로 연동 */}
                      <TableCell
                        align="center"
                        sx={{ whiteSpace: "pre-line" }}
                      >
                        {renderMultiline(merged.cont_no)}
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {renderMultiline(merged.bl_no)}
                      </TableCell>

                      <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{displayShortDate(etd)}</TableCell>
                      <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{displayShortDate(eta)}</TableCell>
                      <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{displayShortDate(delayed)}</TableCell>


                      {/* 도착 여부 컬럼 */}
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: arrived ? '#1b5e20' : '#c62828',
                          bgcolor: arrived ? '#a5d6a7' : '#ffcdd2',
                          whiteSpace: "nowrap"
                        }}
                      >
                        {arrived ? '도착' : '미도착'}
                      </TableCell>
                    </TableRow>
                  );
                })}


              </TableBody>
            </Table>
          ) : (
            <Typography sx={{ textAlign: 'center', color: '#888' }}>
              검색 결과가 없습니다.
            </Typography>
          )}


        </Box>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",   // ⭐ 추가!

            justifyContent: "center",
            alignItems: "center",
          }}
        >

          {/* 수출자 & 품목 콤보박스 그룹 */}
          <Box sx={{
            minHeight: "100px",
            height: "auto",
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',   // ⭐ 핵심!
            gap: 3,
            justifyContent: 'flex-start',
            alignItems: 'center',
            p: 2
          }}>

            {/* 🔹 첫 번째 줄: 수출자 + 품목 */}
            <Box sx={{ display: "flex", gap: 5, mb: 1 }}>
              {/* 수출자 콤보박스 */}
              <Box sx={{ width: "100px" }}>
                <Typography sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>수출자</Typography>

                <Select
                  fullWidth
                  value={selectedExporter || ""}
                  onChange={(e) => {
                    const value = e.target.value;

                    // 선택 해제
                    if (value === "") {
                      setSelectedExporter(null);
                      setSelectedItem(null);
                      setSelectionPriority(null);
                      // 🔥 전체 선택하면 자동 스크롤 다운
                      setTimeout(scrollToBottom, 10);
                      return;
                    }

                    setSelectedExporter(value);

                    if (!selectionPriority) setSelectionPriority("exporter");

                    // 수출자가 먼저 선택된 경우 → 품목 필터링
                    if (selectionPriority === "exporter") {
                      if (selectedItem && !exporterToItems[value]?.includes(selectedItem)) {
                        setSelectedItem(null);
                      }
                    }
                  }}
                  displayEmpty
                  sx={{
                    bgcolor: "#fff", borderRadius: 1, fontSize: "0.8rem", fontWeight: "bold",
                    "& .MuiSelect-select": {   // 🔥 콤보박스 안 텍스트 스타일
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#333",
                      padding: "10px 14px"
                    }
                  }}
                >
                  <MenuItem value=""
                    sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#222" }}>
                    <em>전체</em>
                  </MenuItem>
                  {["모텍", "오토텍", "이엔지", "정공"].map((exp) => (
                    <MenuItem key={exp} value={exp}
                      sx={{
                        fontSize: "0.9rem", fontWeight: 600, fontFamily: "Arial", color: "#222"
                      }}>
                      {exp}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              {/* 품목 콤보박스 */}
              <Box sx={{ width: "100px" }}>
                <Typography sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>품목구분</Typography>

                <Select
                  fullWidth
                  value={selectedItem || ""}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value === "") {
                      setSelectedItem(null);
                      setSelectedExporter(null);
                      setSelectionPriority(null);
                      return;
                    }

                    setSelectedItem(value);

                    if (!selectionPriority) setSelectionPriority("item");

                    // 품목이 먼저 선택된 경우 → 수출자 필터링
                    if (selectionPriority === "item") {
                      if (selectedExporter && !itemToExporters[value]?.includes(selectedExporter)) {
                        setSelectedExporter(null);
                      }
                    }
                  }}
                  displayEmpty
                  sx={{
                    bgcolor: "#fff", borderRadius: 1, fontSize: "0.8rem", fontWeight: "bold",
                    "& .MuiSelect-select": {   // 🔥 콤보박스 안 텍스트 스타일
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#333",
                      padding: "10px 14px"
                    }
                  }}
                >
                  <MenuItem value=""
                    sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#222" }}>
                    <em>전체</em>
                  </MenuItem>
                  {["EV-SUB", "TOOL", "건설자재", "단조소재", "설비", "오일"].map((cat) => (
                    <MenuItem key={cat} value={cat}
                      sx={{ fontSize: "0.9rem", fontWeight: 600, fontFamily: "Arial", color: "#222" }}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ fontWeight: "bold", mb: 1 }}>기간 (ETD.KR ~ ETA.US)</Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <TextField
                  type="date"
                  value={etdStart}
                  onChange={(e) => setEtdStart(e.target.value)}
                  size="small"
                  sx={{ width: 170 }}
                />

                <Typography>~</Typography>

                <TextField
                  type="date"
                  value={etaEnd}
                  onChange={(e) => setEtaEnd(e.target.value)}
                  size="small"
                  sx={{ width: 170 }}
                />

              </Box>
            </Box>


          </Box>
        </Box>
      </Box>


      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, pb: 1 }}>
        {/* 우측 필터 버튼 */}
        <Button
          onClick={() => {
            setShowUpcoming((prev) => {
              const newState = !prev;

              // 🔥 prev === true → 비활성화(OFF) 되는 순간만 스크롤 다운
              if (prev === true && newState === false) {
                setTimeout(scrollToBottom, 10);
              }

              return newState;
            });
          }}
          sx={{
            bgcolor: showUpcoming ? '#ff6b6b' : '#ffecec',
            color: '#d32f2f',
            fontWeight: 'bold',
            px: 3,
            borderRadius: 2,
            fontSize: '0.95rem',
            '&:hover': { bgcolor: '#ffcccc' }
          }}
        >
          <Typography component="span" sx={{ color: 'black', fontWeight: 'bold' }}>
            금일 이후 도착분
          </Typography>
          <Typography component="span" sx={{ color: '#d32f2f', fontWeight: 'bold', ml: 0.7 }}>
            (5일전)
          </Typography>
        </Button>

        <Button
          variant="contained"
          color={sortMode ? "secondary" : "info"}
          size="small"
          disabled={!isEditMode}   // 🔥 수정모드 OFF면 비활성화
          onClick={() => {
            if (!isEditMode) {
              alert("수정 모드를 먼저 활성화하세요.");
              return;
            }

            setSortMode(prev => !prev);
            if (!sortMode) {
              alert("🔧 행 정렬 모드가 활성화되었습니다.\n드래그해서 순서를 변경하세요.");
            } else {
              alert("✔ 행 정렬 모드 종료");
            }
          }}
        >
          {sortMode ? "정렬 종료" : "행 정렬"}
        </Button>


        <Button
          variant="contained"
          color="success"
          size="small"
          disabled={!isEditMode}   // 🔥 수정 모드 OFF면 추가 불가
          onClick={() => {
            if (!isEditMode) {
              alert("수정 모드를 먼저 활성화하세요.");
              return;
            }
            handleAdd();
          }}
        >
          추가
        </Button>

        <Button
          variant="contained"
          color={isEditMode ? 'secondary' : 'warning'}
          size="small"
          onClick={() => {
            setIsEditMode((prev) => {
              const newMode = !prev;
              if (newMode) {
                alert('🔧 수정 모드가 활성화되었습니다.\n셀을 클릭하면 데이터를 편집할 수 있습니다.\n\n ETD,ETA,DELAYED DATE는\n 반드시 YYYY-MM-DD 형식으로 입력바랍니다.');
              } else {
               
              }
              // 🔥 색상 다시 적용하도록 강제 refresh
              setRefreshTick(t => t + 1);
              return newMode;
            });
          }}
          sx={{
            fontWeight: 700,
            minWidth: 90,
            height: 36,

            backgroundColor: '#364759',   // ✅ 차콜 (돋보기 기준)
            color: '#E5E7EB',

            border: '1px solid #465A72',

            '&:hover': {
              backgroundColor: '#3F5368', // ✅ 살짝만 밝게
              borderColor: '#5A6F87',
            },

            '&:active': {
              backgroundColor: '#2E3D4D',
            },

            '&:focus-visible': {
              outline: 'none',
              boxShadow: 'none',
            },

            // 🔥 수정모드 ON일 때만 살짝 강조
            ...(isEditMode && {
              backgroundColor: '#42586F',
              borderColor: '#6B829C',
              color: 'white',
            })
          }}
        >
          {isEditMode ? '수정 종료' : '수정 모드'}
        </Button>
        <Button
          variant="contained"
          color="error"
          size="small"
          disabled={!isEditMode}   // 🔥 수정 모드 OFF면 삭제 불가
          onClick={async () => {
            if (!isEditMode) {
              alert("수정 모드를 먼저 활성화하세요.");
              return;
            }

            // 기존 삭제 로직 그대로
            if (!deleteMode) {
              setDeleteMode(true);
              alert("🗑 삭제 모드 활성화\n행을 클릭해서 선택하세요.");
              return;
            }

            if (selectedInvs.length === 0) {
              alert("삭제할 항목이 없습니다.");
              setDeleteMode(false);
              return;
            }

            if (!window.confirm(`${selectedInvs.length}개 항목을 삭제할까요?`)) return;

            for (const inv of selectedInvs) {
              await apiFetch(`${API_BASE}/api/invoices/inv/${inv}`, {
                method: "DELETE",
              });
            }

            setRows(prev => prev.filter(r => !selectedInvs.includes(r.inv_no)));
            setSelectedInvs([]);
            setDeleteMode(false);
          }}
        >
          {deleteMode ? "삭제 실행" : "삭제"}
        </Button>


      </Box>

      {/* 하단 표 */}
      <Box ref={bottomScrollRef} sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 2 }}>
        <Paper elevation={2}>
          <Table size="small" stickyHeader>
            <TableHead sx={{ bgcolor: '#ffda66', '& th': { fontSize: '0.8rem', fontWeight: 700 } }}>
              <TableRow>
                {[
                  'ID',
                  'EXPORTER',
                  'INV#',
                  'INV 금액',
                  <TableCell sx={{ width: '140px', textAlign: 'center', fontWeight: 'bold' }}>
                    <div>품목<br/>구분</div>
                  </TableCell>
                  ,
                  'CONT#',
                  'BL#',
                  <Box key="etdHeader" sx={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
                    ETD<br />(공장 출발 예정일)
                  </Box>,
                  <Box key="etaHeader" sx={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
                    ETA<br />(공장 도착 예정일)
                  </Box>,
                  <Box key="delayed" sx={{ textAlign: 'center', lineHeight: 1.2 }}>
                    <Typography sx={{ fontWeight: 'bold' }}>DELAYED DATE</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 14, height: 14, bgcolor: '#d6eaff', border: '1px solid #bbb' }} />
                      <Typography sx={{ fontSize: '0.7rem' }}>: 도착 완료</Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 1,
                        mt: 0.3
                      }}
                    >
                      <Box sx={{ width: 14, height: 14, bgcolor: '#ffcccc', border: '1px solid #bbb' }} />
                      <Typography sx={{ fontSize: '0.6rem', color: '#333' }}>
                        : 금일 이후 도착<br />{' '}
                        <span style={{ color: 'red', fontWeight: 'bold', fontSize: '0.7rem' }}> (5일전)</span>
                      </Typography>
                    </Box>
                  </Box>,
                  <Box key="countHeader" sx={{ textAlign: 'center', lineHeight: 1.2 }}>
                    <Typography sx={{ fontWeight: 'bold' }}>COUNT</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 14, height: 14, bgcolor: '#ccf2e0', border: '1px solid #bbb' }} />
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                        <Box component="span" sx={{ color: '#333' }}>:</Box>{' '}
                        <Box component="span" sx={{ color: 'red', fontSize: "10px" }}>
                          지연<br /> 경고<br />(10일)
                        </Box>
                      </Typography>
                    </Box>
                  </Box>,
                  '도비필요',
                  '비고'
                ].map((h) => (
                  <TableCell key={h} align="center" sx={{ fontWeight: 'bold', color: '#333' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            {/* ==========================  
    🔥 정렬 모드 조건부 렌더링  
   ========================== */}
            {sortMode ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredRows.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <TableBody>
                    {filteredRows.map((row, i) => {
                      // === 날짜 정규화 ===
                      const etdDate = parseKRDate(normalizeDate(row.etd));
                      const etaDate = parseUSDate(normalizeDate(row.eta));


                      const delayedDate = row.delayed_date
                        ? parseUSDate(normalizeDate(row.delayed_date))
                        : etaDate;

                      // === ETA까지 남은 날짜 ===
                      const daysToArrival = Math.floor((delayedDate - todayUS) / (1000 * 60 * 60 * 24));


                      // === ETA vs 실제 도착일 ===
                      const diffDays = Math.floor((delayedDate - etaDate) / (1000 * 60 * 60 * 24));
                      const countText = `${diffDays}일`;
                      const countNum = diffDays;

                      // === 색상 스타일 ===
                      let delayedStyle = {};
                      if (daysToArrival < 0) {
                        delayedStyle = { bgcolor: "#d6eaff" };
                      } else if (daysToArrival >= 0 && daysToArrival <= 5 <= 5) {
                        delayedStyle = {
                          bgcolor: "#ffcccc",
                          color: "#b71c1c",
                          fontWeight: "bold",
                        };
                      } else {
                        delayedStyle = { bgcolor: "#ffcccc" };
                      }

                      const countStyle =
                        countNum >= 10
                          ? { bgcolor: "#ccf2e0", color: "red", fontWeight: "bold" }
                          : { bgcolor: "white", color: "black", fontWeight: "normal" };

                      const rowBg = i % 2 === 0 ? "#fff5e6" : "#ffffff";

                      return (
                        <SortableRow key={row.id} row={row} rowBg={rowBg} sortMode={true}>
                          {[
                            row.id,
                            row.exporter,
                            row.inv_no,
                            row.amount,
                            row.item_type,
                            row.cont_no,
                            row.bl_no,
                            displayShortDate(row.etd),
                            displayShortDate(row.eta),
                            displayShortDate(row.delayed_date),
                            countText,
                            row.needs_help,
                            row.remark
                          ].map((val, idx) => (
                            <TableCell
                              key={idx}
                              align="center"
                              sx={{
                                fontSize: "0.9rem",
                                ...(deleteMode && selectedInvs.includes(row.inv_no) && {
                                  bgcolor: "#ffcccc !important",
                                  color: "black",
                                  fontWeight: "bold",
                                }),
                                ...(idx === 2 && { color: "blue", cursor: "pointer", textDecoration: "underline", whiteSpace: "nowrap", }),
                                ...([7, 8, 9].includes(idx) && {

                                  whiteSpace: "nowrap",   // ⭐ 줄바꿈 방지
                                  minWidth: 90,           // ⭐ ETA 폭 확보 (필수)
                                }),
                                ...(idx === 9 ? delayedStyle : {}),
                                ...(idx === 10 ? countStyle : {}),
                                ...(idx === 5 || idx === 6 || idx === 12 ? { whiteSpace: "pre-line" } : {}),
                                ...(userRole === "admin" && { cursor: "pointer" })
                              }}
                              onClick={() => {
                                // ✅ 삭제 모드: 행 선택만 수행
                                if (deleteMode) {
                                  setSelectedInvs(prev =>
                                    prev.includes(row.inv_no)
                                      ? prev.filter(v => v !== row.inv_no)
                                      : [...prev, row.inv_no]
                                  );
                                  return;
                                }

                                // 🔽 아래는 기존 수정 / 이동 로직 그대로
                                if (idx === 2 && !isEditMode) {
                                  return navigate(`/packing-list/${row.inv_no}`);
                                }

                                if (idx === 4 && isEditMode) {
                                  setEditingItemRowId(row.id);
                                  return;
                                }

                                if (userRole === "admin" && isEditMode) {
                                  const value = prompt("값 수정\n날짜는 반드시 YYYY-MM-DD", String(val || ""));
                                  if (value !== null) {
                                    const keys = [
                                      "id",
                                      "exporter",
                                      "inv_no",
                                      "amount",
                                      "item_type",
                                      "cont_no",
                                      "bl_no",
                                      "etd",
                                      "eta",
                                      "delayed_date",
                                      "count_days",
                                      "needs_help",
                                      "remark"
                                    ];
                                    handleEdit(row.id, keys[idx], value);
                                  }
                                }
                              }}

                            >
                              {/* 🔥 여기서부터 품목구분 전용 렌더링 */}
                              {idx === 4 && isEditMode ? (
                                editingItemRowId === row.id ? (
                                  <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                                    <Select
                                      size="small"
                                      value={row.item_type}
                                      onChange={(e) => {
                                        const v = e.target.value;

                                        if (v === "__custom__") {
                                          const custom = prompt("품목구분 직접 입력", row.item_type || "");
                                          if (custom && custom.trim()) {
                                            handleEdit(row.id, "item_type", custom.trim());
                                          }
                                        } else {
                                          handleEdit(row.id, "item_type", v);
                                        }

                                        setEditingItemRowId(null);
                                      }}
                                      sx={{
                                        minWidth: 120,
                                        "& .MuiSelect-select": {
                                          fontWeight: 700,
                                          fontSize: "0.85rem",
                                          color: "#222",
                                        }
                                      }}
                                    >
                                      {/* 🔥 현재 값이 기본 목록에 없으면 임시로 보여주기 */}
                                      {!ITEM_TYPES.includes(row.item_type) && (
                                        <MenuItem value={row.item_type}>
                                          {row.item_type}
                                        </MenuItem>
                                      )}

                                      {ITEM_TYPES.map(t => (
                                        <MenuItem key={t} value={t}>{t}</MenuItem>
                                      ))}

                                      <MenuItem value="__custom__">직접입력</MenuItem>
                                    </Select>




                                    {editingItemRowId === row.id && editingItemValue === "__custom__" && (


                                      <TextField
                                        size="small"
                                        value={customItemValue}
                                        placeholder="직접 입력"
                                        onChange={(e) => setCustomItemValue(e.target.value)}
                                        onBlur={() => {
                                          if (customItemValue.trim()) {
                                            handleEdit(row.id, "item_type", customItemValue.trim());
                                          }
                                          setEditingItemRowId(null);
                                          setCustomItemValue("");
                                        }}
                                        sx={{ width: 120 }}
                                      />
                                    )}
                                  </Box>
                                ) : (
                                  <Box
                                    sx={{ cursor: "pointer", fontWeight: 600 }}
                                    onClick={() => setEditingItemRowId(row.id)}
                                  >
                                    {row.item_type}
                                  </Box>
                                )
                              ) : (
                                (idx === 5 || idx === 6 || idx === 12)
                                  ? (val || "").replace(/@/g, "\n")
                                  : val
                              )}
                            </TableCell>

                          ))}
                        </SortableRow>
                      );
                    })}
                  </TableBody>
                </SortableContext>
              </DndContext>
            ) : (
              /* ==========================  
                  🔥 정렬 OFF: 단순 TableBody  
                 ========================== */
              <TableBody>
                {filteredRows.map((row, i) => {
                  // 동일 코드 (정렬 OFF에서도 로직 그대로 유지)
                  const etdDate = parseKRDate(normalizeDate(row.etd));
                  const etaDate = parseUSDate(normalizeDate(row.eta));

                  const delayedDate = row.delayed_date
                    ? parseUSDate(normalizeDate(row.delayed_date))
                    : etaDate;






                  // === delayed_date 기준 남은 날짜 ===
                  const daysToArrival = Math.floor((delayedDate - todayUS) / (1000 * 60 * 60 * 24));

                  // === 색상 스타일 ===
                  let delayedStyle = {};
                  // === ETA vs 실제 도착일 ===
                  const diffDays = Math.floor((delayedDate - etaDate) / (1000 * 60 * 60 * 24));
                  const countText = `${diffDays}일`;
                  const countNum = diffDays;
                  if (daysToArrival < 0) {
                    // 이미 도착 완료
                    delayedStyle = { bgcolor: "#d6eaff" };
                  }
                  else if (daysToArrival >= 0 && daysToArrival <= 5) {
                    // 금일 이후 + 5일 이내 도착
                    delayedStyle = {
                      bgcolor: "#ffcccc",
                      color: "#b71c1c",
                      fontWeight: "bold",
                    };
                  }
                  else {
                    // 5일 이후 도착, 연한 빨강
                    delayedStyle = { bgcolor: "#ffcccc" };
                  }


                  const countStyle =
                    countNum >= 10
                      ? { bgcolor: "#ccf2e0", color: "red", fontWeight: "bold" }
                      : { bgcolor: "white", color: "black", fontWeight: "normal" };

                  const rowBg = i % 2 === 0 ? "#fff5e6" : "#ffffff";

                  return (
                    <SortableRow key={row.id} row={row} rowBg={rowBg} sortMode={false}>
                      {[
                        row.id,
                        row.exporter,
                        row.inv_no,
                        row.amount,
                        row.item_type,
                        row.cont_no,
                        row.bl_no,
                        displayShortDate(row.etd),
                        displayShortDate(row.eta),
                        displayShortDate(row.delayed_date),
                        countText,
                        row.needs_help,
                        row.remark
                      ].map((val, idx) => (
                        <TableCell
                          key={idx}
                          align="center"
                          sx={{
                            fontSize: "0.9rem",
                            ...(deleteMode && selectedInvs.includes(row.inv_no) && {
                              bgcolor: "#ffcccc !important",
                              color: "black",
                              fontWeight: "bold",
                            }),
                            ...(idx === 2 && { color: "blue", cursor: "pointer", textDecoration: "underline", whiteSpace: "nowrap", }),
                            ...([7, 8, 9].includes(idx) && {

                              whiteSpace: "nowrap",   // ⭐ 줄바꿈 방지
                              minWidth: 90,           // ⭐ ETA 폭 확보 (필수)
                            }),
                            ...(idx === 9 ? delayedStyle : {}),
                            ...(idx === 10 ? countStyle : {}),
                            ...(idx === 5 || idx === 6 || idx === 12 ? { whiteSpace: "pre-line" } : {}),
                            ...(userRole === "admin" && { cursor: "pointer" })
                          }}
                          onClick={() => {
                            // ✅ 삭제 모드: 행 선택만 수행
                            if (deleteMode) {
                              setSelectedInvs(prev =>
                                prev.includes(row.inv_no)
                                  ? prev.filter(v => v !== row.inv_no)
                                  : [...prev, row.inv_no]
                              );
                              return;
                            }

                            // 🔽 아래는 기존 수정 / 이동 로직 그대로
                            if (idx === 2 && !isEditMode) {
                              return navigate(`/packing-list/${row.inv_no}`);
                            }

                            if (idx === 4 && isEditMode) {
                              setEditingItemRowId(row.id);
                              return;
                            }

                            if (userRole === "admin" && isEditMode) {
                              const value = prompt("값 수정\n날짜는 반드시 YYYY-MM-DD", String(val || ""));
                              if (value !== null) {
                                const keys = [
                                  "id",
                                  "exporter",
                                  "inv_no",
                                  "amount",
                                  "item_type",
                                  "cont_no",
                                  "bl_no",
                                  "etd",
                                  "eta",
                                  "delayed_date",
                                  "count_days",
                                  "needs_help",
                                  "remark"
                                ];
                                handleEdit(row.id, keys[idx], value);
                              }
                            }
                          }}

                        >
                          {/* 🔥 여기서부터 품목구분 전용 렌더링 */}
                          {idx === 4 && isEditMode ? (
                            editingItemRowId === row.id ? (
                              <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                                <Select
                                  size="small"
                                  value={row.item_type}
                                  onChange={(e) => {
                                    const v = e.target.value;

                                    if (v === "__custom__") {
                                      const custom = prompt("품목구분 직접 입력", row.item_type || "");
                                      if (custom && custom.trim()) {
                                        handleEdit(row.id, "item_type", custom.trim());
                                      }
                                    } else {
                                      handleEdit(row.id, "item_type", v);
                                    }

                                    setEditingItemRowId(null);
                                  }}
                                  sx={{
                                    minWidth: 120,
                                    "& .MuiSelect-select": {
                                      fontWeight: 700,
                                      fontSize: "0.85rem",
                                      color: "#222",
                                    }
                                  }}
                                >
                                  {/* 🔥 현재 값이 기본 목록에 없으면 임시로 보여주기 */}
                                  {!ITEM_TYPES.includes(row.item_type) && (
                                    <MenuItem value={row.item_type}>
                                      {row.item_type}
                                    </MenuItem>
                                  )}

                                  {ITEM_TYPES.map(t => (
                                    <MenuItem key={t} value={t}>{t}</MenuItem>
                                  ))}

                                  <MenuItem value="__custom__">직접입력</MenuItem>
                                </Select>


                                {editingItemRowId === row.id && editingItemValue === "__custom__" && (


                                  <TextField
                                    size="small"
                                    value={customItemValue}
                                    placeholder="직접 입력"
                                    onChange={(e) => setCustomItemValue(e.target.value)}
                                    onBlur={() => {
                                      if (customItemValue.trim()) {
                                        handleEdit(row.id, "item_type", customItemValue.trim());
                                      }
                                      setEditingItemRowId(null);
                                      setCustomItemValue("");
                                    }}
                                    sx={{ width: 120 }}
                                  />
                                )}
                              </Box>
                            ) : (
                              <Box
                                sx={{ cursor: "pointer", fontWeight: 600 }}
                                onClick={() => setEditingItemRowId(row.id)}
                              >
                                {row.item_type}
                              </Box>
                            )
                          ) : (
                            (idx === 5 || idx === 6 || idx === 12)
                              ? (val || "").replace(/@/g, "\n")
                              : val
                          )}
                        </TableCell>
                      ))}
                    </SortableRow>
                  );
                })}
              </TableBody>
            )}



          </Table>
        </Paper>
      </Box>
    </Box>
  );
}
