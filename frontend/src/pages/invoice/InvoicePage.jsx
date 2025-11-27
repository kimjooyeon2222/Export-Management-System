import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from "uuid";
import { useRef } from "react";

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
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

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
  const bottomScrollRef = useRef(null);
  const scrollToBottom = () => {
  if (bottomScrollRef.current) {
    bottomScrollRef.current.scrollTop = bottomScrollRef.current.scrollHeight;
  }
};


  const navigate = useNavigate();
  const [poNumber, setPoNumber] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [userRole] = useState('admin');
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
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

  // 기본 데이터
  const [rows, setRows] = useState([]);
  useEffect(() => {
  fetch(`${API_BASE}/api/invoices`)
    .then(res => res.json())
    .then(data => setRows(data))
    .catch(err => console.error("Invoice API Error:", err));
}, []);

useEffect(() => {
  if (!isEditMode) {
    scrollToBottom();
  }
}, [rows, isEditMode]);   // ← isEditMode도 dependency로 추가

  // CRUD 기능

const handleAdd = async () => {
  const newRow = {
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
    needs_help: "-",
    remark: "신규 데이터"
  };

  const res = await fetch(`${API_BASE}/api/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    await fetch(`${API_BASE}/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value })
    });
  };


  const handleDelete = async (inv_no) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    // 1) DB 삭제 요청 (INV 번호 기준)
    await fetch(`${API_BASE}/api/invoices/inv/${inv_no}`, {
      method: "DELETE"
    });

    // 2) 프론트 화면에서도 삭제
    setRows(prev => prev.filter(r => r.inv_no !== inv_no));
  };



  const shipment = {
    exporter: '오토텍',
    inv: 'ATT-SUP-20250924-V1',
    cont: 'HMMU6530409',
    bl: 'WIU525100870',
    etd: '2025-10-04',
    eta: '2025-11-03',
    factory: '2025-11-04',
    arrival: '미착'
  };

  const handleSearch = async () => {
  const allPacking = await fetch(`${API_BASE}/api/packing`).then(r => r.json());
  const allInvoice = await fetch(`${API_BASE}/api/invoices`).then(r => r.json());

  if (!poNumber.trim()) {
    alert("PO 번호를 입력하세요.");
    return;
  }

  // 🔹 입력값 정규화
  const input = poNumber.trim().replace(/[^0-9A-Za-z]/g, "").toLowerCase();

  // 🔹 PO 완전 일치 or 부분 포함 둘 다 허용
  const matchedPacking = allPacking.filter((r) => {
    const poValue = String(r.po_no || "")
      .trim()
      .replace(/[^0-9A-Za-z]/g, "")
      .toLowerCase();
    return poValue === input || poValue.includes(input);
  });

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




  const parseDate = (str) => new Date(str);

  // 필터링 로직 (수출자 / 품목 버튼 반영)
  const filteredRows = rows.filter((r) => {


    // 기본조건: showUpcoming (5일 이내 필터링)
    if (showUpcoming) {
      const etaDate = parseDate(r.eta);
      const diffETA = Math.floor((etaDate - today) / (1000 * 60 * 60 * 24));
      if (diffETA <= 0) return false;
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
  });
  // 미국 앨라배마(Chicago) 시간으로 날짜 변환
const getUSDate = (dateStr) =>
  new Date(
    new Date(dateStr).toLocaleString("en-US", {
      timeZone: "America/Chicago",
    })
  );

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

// 한국시간(ETD용)
const getKoreaDate = (dateStr) =>
  new Date(new Date(dateStr).toLocaleString("en-US", { timeZone: "Asia/Seoul" }));

// 미국 앨라배마 시간(ETA, 공장도착일용)
const getAlabamaDate = (dateStr) =>
  new Date(new Date(dateStr).toLocaleString("en-US", { timeZone: "America/Chicago" }));




  return (
    <Box sx={{ bgcolor: '#fff', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 타이틀 */}
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'black', fontSize: '1.3rem', pl: 3, pt: 2 }}>
        수출일정 통합관리부
      </Typography>

      {/* 헤더 */}
      <Box
        sx={{
          bgcolor: '#b34b00',
          color: 'white',
          position: 'relative',
          py: 1.5,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          sx={{
            color: 'white',
            borderColor: 'white',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
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
          <Typography sx={{ fontWeight: 'bold', color: 'white', fontSize: '1.1rem' }}>
            SHINHWA | PO 검색
          </Typography>
          <TextField
            variant="outlined"
            size="small"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="4500001303"
            sx={{
              bgcolor: 'white',
              borderRadius: 1,
              width: '240px',
              '& input': { fontSize: '1rem', fontWeight: 500 }
            }}
          />
          <Button
            variant="contained"
            sx={{
              bgcolor: '#ffcc00',
              color: 'black',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              px: 2,
              '&:hover': { bgcolor: '#ffb300' }
            }}
            onClick={handleSearch}
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
            flex: 3,
            border: '1px solid #ccc',
            borderRadius: 1,
            p: 2,
            overflowY: 'auto',
            maxHeight: '330px' // 검색결과 영역 고정 높이 (스크롤 전용)

          }}
        >
        {searchResult && searchResult.length > 0 ? (
  <Table size="small">
    <TableHead sx={{ bgcolor: '#f9f9f9' }}>
      <TableRow>
        {['수출자', 'INV#', 'CONT#', 'BL#', 'ETD (출발 예정일)', 'ETA (도착 예정일)', '공장 도착일', '도착여부'].map((col) => (
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

  // 도착 여부 계산 (ETA vs 공장도착일, 둘 다 미국시간 기준)
  const etaUS = getAlabamaDate(eta);
  const factoryUS = merged.delayed_date
  ? getAlabamaDate(merged.delayed_date)
  : etaUS;

  // ETA == 공장도착일 → 도착
  // ETA < 공장도착일 → 미도착
  const arrived =
    etaUS.toDateString() === factoryUS.toDateString()
      ? true
      : etaUS < factoryUS
      ? false
      : false;


  return (
    <TableRow key={i}>
      <TableCell align="center">{merged.exporter || '오토텍'}</TableCell>

      {/* INV 클릭 시 PACKING LIST 이동 */}
      <TableCell
        align="center"
        sx={{
          color: 'blue',
          cursor: 'pointer',
          textDecoration: 'underline',
          fontWeight: 'bold'
        }}
        onClick={() => window.location.assign(`/packing-list/${merged.inv_no}`)}
      >
        {merged.inv_no}
      </TableCell>

      {/* 하단 표 데이터 그대로 연동 */}
      <TableCell align="center">{merged.cont_no || '-'}</TableCell>
      <TableCell align="center">{merged.bl_no || '-'}</TableCell>
      <TableCell align="center">{etd}</TableCell>
      <TableCell align="center">{eta}</TableCell>
      <TableCell align="center">{delayed}</TableCell>

      {/* 도착 여부 컬럼 */}
      <TableCell
        align="center"
        sx={{
          fontWeight: 'bold',
          textAlign: 'center',
          color: arrived ? '#1b5e20' : '#c62828',
          bgcolor: arrived ? '#a5d6a7' : '#ffcdd2'
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

       {/* 수출자 & 품목 버튼 그룹 */}
<Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', p: 1 }}>
  {/* 수출자 버튼 그룹 */}
  <Box sx={{ flex: 1, mr: 1 }}>
    <Typography sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>수출자</Typography>
    {['모텍', '오토텍', '이엔지', '정공'].map((exp) => {
      const isSelected = selectedExporter === exp;

      const isActive =
        selectionPriority === 'item'
          ? itemToExporters[selectedItem]?.includes(exp) || isSelected
          : true;

      return (
        <Button
          key={exp}
          fullWidth
          onClick={() => {
            if (isSelected) {
              if (selectionPriority === 'exporter') {
                // 수출자가 먼저 눌린 경우 → 전체 초기화
                setSelectedExporter(null);
                setSelectedItem(null);
                setSelectionPriority(null);
              } else {
                // 품목이 먼저 눌린 경우 → 수출자만 해제
                setSelectedExporter(null);
              }
            } else {
              // 새 수출자 선택
              if (selectionPriority === 'exporter' && selectedExporter && selectedExporter !== exp) {
                setSelectedItem(null);
              }
              setSelectedExporter(exp);
              if (!selectionPriority) setSelectionPriority('exporter');
            }
          }}
          sx={{
            mb: 1,
            bgcolor: isSelected ? '#b86b00' : isActive ? '#f5c374' : '#ddd',
            color: isSelected ? 'white' : isActive ? '#4b2e05' : '#888',
            fontWeight: 'bold',
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: isSelected ? '0 3px 6px rgba(0,0,0,0.3)' : 'none',
            cursor: isActive ? 'pointer' : 'not-allowed',
            '&:hover': isActive ? { bgcolor: '#a66900' } : {}
          }}
          disabled={!isActive}
        >
          {exp}
        </Button>
      );
    })}
  </Box>

  {/* 품목 버튼 그룹 */}
  <Box sx={{ flex: 1 }}>
    <Typography sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>품목구분</Typography>
    {['EV-SUB', 'TOOL', '건설자재', '단조소재', '설비', '오일'].map((cat) => {
      const isSelected = selectedItem === cat;

      const isActive =
        selectionPriority === 'exporter'
          ? exporterToItems[selectedExporter]?.includes(cat) || isSelected
          : true;

      return (
        <Button
          key={cat}
          fullWidth
          onClick={() => {
            if (isSelected) {
              if (selectionPriority === 'item') {
                // 품목이 먼저 눌린 경우 → 전체 초기화
                setSelectedItem(null);
                setSelectedExporter(null);
                setSelectionPriority(null);
              } else {
                // 수출자가 먼저 눌린 경우 → 품목만 해제
                setSelectedItem(null);
              }
            } else {
              // 새 품목 선택
              if (selectionPriority === 'item' && selectedItem && selectedItem !== cat) {
                setSelectedExporter(null);
              }
              setSelectedItem(cat);
              if (!selectionPriority) setSelectionPriority('item');
            }
          }}
          sx={{
            mb: 1,
            bgcolor: isSelected ? '#007f7f' : isActive ? '#66b2b2' : '#ddd',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: isSelected ? '0 3px 6px rgba(0,0,0,0.3)' : 'none',
            cursor: isActive ? 'pointer' : 'not-allowed',
            '&:hover': isActive ? { bgcolor: '#006666' } : {}
          }}
          disabled={!isActive}
        >
          {cat}
        </Button>
      );
    })}
  </Box>
</Box>


</Box>



      {/* 관리자용 버튼 */}
      {userRole === 'admin' && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, pb: 1 }}>
                  {/* 우측 필터 버튼 */}
        <Button
          onClick={() => setShowUpcoming((prev) => !prev)}
          sx={{
            bgcolor: showUpcoming ? '#ffd6d6' : '#ffecec',
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
          <Typography component="span" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
            (5일전)
          </Typography>
        </Button>
          <Button variant="contained" color="success" size="small" onClick={handleAdd}>
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
                  alert('🔧 수정 모드가 활성화되었습니다.\n셀을 클릭하면 데이터를 편집할 수 있습니다.');
                } else {
                  alert('✅ 수정 모드가 종료되었습니다.\n이제 표는 읽기 전용 상태입니다.');
                }
                return newMode;
              });
            }}
          >
            {isEditMode ? '수정 종료' : '수정 모드'}
          </Button>
          <Button
  variant="contained"
  color="error"
  size="small"
  onClick={async () => {
    // 삭제 모드 진입
    if (!deleteMode) {
      setDeleteMode(true);
      alert("🗑 삭제 모드 활성화\n행을 클릭해서 선택하세요.");
      return;
    }

    // 삭제 실행
    if (selectedInvs.length === 0) {
      alert("삭제할 항목이 없습니다.");
      setDeleteMode(false);
      return;
    }

    if (!window.confirm(`${selectedInvs.length}개 항목을 삭제할까요?`)) {
      return;
    }

    // 🔥 실제 삭제
    for (const inv of selectedInvs) {
      await fetch(`${API_BASE}/api/invoices/inv/${inv}`, {
        method: "DELETE"
      });
    }

    // 프론트에서도 삭제
    setRows(prev => prev.filter(r => !selectedInvs.includes(r.inv_no)));

    // 초기화
    setSelectedInvs([]);
    setDeleteMode(false);
  }}
>
  {deleteMode ? "삭제 실행" : "삭제"}
</Button>

        </Box>
      )}

      {/* 하단 표 */}
      <Box ref={bottomScrollRef} sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 2 }}>
        <Paper elevation={2}>
          <Table size="small" stickyHeader>
            <TableHead sx={{ bgcolor: '#ffda66' }}>
              <TableRow>
                {[
                  'NO',
                  'EXPORTER',
                  'INV#',
                  'INV 금액',
                  <TableCell sx={{ width: '140px', textAlign: 'center', fontWeight: 'bold' }}>
  <div>품목구분</div>
</TableCell>
,
                  'CONT#',
                  'BL#',
                    <Box key="etdHeader" sx={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
                      ETD<br />(출발 예정일)
                    </Box>,
                    <Box key="etaHeader" sx={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
                      ETA<br />(공장 도착 예정일)
                    </Box>,
                    <Box key="delayed" sx={{ textAlign: 'center', lineHeight: 1.2 }}>
                      <Typography sx={{ fontWeight: 'bold' }}>DELAYED DATE</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 14, height: 14, bgcolor: '#d6eaff', border: '1px solid #bbb' }} />
                        <Typography sx={{ fontSize: '0.8rem' }}>: 도착 완료</Typography>
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
                        <Typography sx={{ fontSize: '0.8rem', color: '#333' }}>
                          : 금일 이후 도착{' '}
                          <span style={{ color: 'red', fontWeight: 'bold' }}> (5일전)</span>
                        </Typography>
                      </Box>
                    </Box>,
                    <Box key="countHeader" sx={{ textAlign: 'center', lineHeight: 1.2 }}>
                      <Typography sx={{ fontWeight: 'bold' }}>COUNT</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 14, height: 14, bgcolor: '#ccf2e0', border: '1px solid #bbb' }} />
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                          <Box component="span" sx={{ color: '#333' }}>:</Box>{' '}
                          <Box component="span" sx={{ color: 'red' }}>
                            지연 경고<br /> (10일 이상)
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

            <TableBody>
  {filteredRows.map((row, i) => {
    // === 날짜 정규화 ===
const etdDate = getKoreaDate(normalizeDate(row.etd));   // 한국 시간
const etaDate = getUSDate(normalizeDate(row.eta));      // 미국 시간
const delayedDate = row.delayed_date
  ? getUSDate(normalizeDate(row.delayed_date))          // 미국 시간
  : etaDate;

// === ETA까지 남은 날짜(색상용) ===
const daysToETA = Math.floor((etaDate - today) / (1000 * 60 * 60 * 24));

// === ETA vs 실제 도착일 차이 ===
const diffDays = Math.floor((delayedDate - etaDate) / (1000 * 60 * 60 * 24));

// COUNT 표시용
const countText = `${diffDays}일`;
const countNum = diffDays;


    // 🚀 지연(Delayed) 색상 스타일 - ETA 기준
let delayedStyle = {};

if (daysToETA < 0) {
  delayedStyle = { bgcolor: "#d6eaff" }; // 파랑
} else if (daysToETA === 0) {
  delayedStyle = {
    bgcolor: "#ffe0b2",
    color: "#e65100",
    fontWeight: "bold",
  };
} else if (daysToETA > 0 && daysToETA <= 5) {
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



    const rowBg = i % 2 === 0 ? '#fff5e6' : '#ffffff';

    return (
      <TableRow
  key={row.id}
  onClick={() => {
    if (!deleteMode) return; // 삭제 모드가 아닐 때는 그냥 무시

    if (selectedInvs.includes(row.inv_no)) {
      setSelectedInvs(prev => prev.filter(v => v !== row.inv_no));
    } else {
      setSelectedInvs(prev => [...prev, row.inv_no]);
    }
  }}
  sx={{
    bgcolor: selectedInvs.includes(row.inv_no)
      ? "#ffdddd"   // 선택된 행 색상
      : rowBg,
    cursor: deleteMode ? "pointer" : "default"
  }}
>
        {[
          row.id,
          row.exporter,
          row.inv_no,
          row.amount,
          row.item_type,
          row.cont_no,
          row.bl_no,
          row.etd,
          row.eta,
          row.delayed_date,
          countText, // 여기서 계산된 값 표시
          row.needs_help,
          row.remark
        ].map((val, idx) => (
          <TableCell
            key={idx}
            align="center"
            sx={{
              
              ...(idx === 2 && { color: 'blue', cursor: 'pointer', textDecoration: 'underline' }),
              ...(idx === 9 ? delayedStyle : {}), // delayed 스타일
              ...(idx === 10 ? countStyle : {}), // count 스타일 적용
              ...(userRole === 'admin' && { cursor: 'pointer' })
            }}
            onClick={() => {
              // INV 클릭 시 링크 이동
              if (idx === 2 && !isEditMode) return navigate(`/packing-list/${row.inv_no}`);

              if (userRole === 'admin' && isEditMode) {
                const value = prompt('값 수정', String(val || ''));
                if (value !== null) {
                  const keys = [
                    'id',
                    'exporter',
                    'inv_no',
                    'amount',
                    'item_type',
                    'cont_no',
                    'bl_no',
                    'etd',
                    'eta',
                    'delayed_date',
                    'count_days',
                    'needs_help',
                    'remark'
                  ];
                  handleEdit(row.id, keys[idx], value);
                }
              }
            }}
          >
            {val}
          </TableCell>
        ))}
      </TableRow>
    );
  })}
</TableBody>

          </Table>
        </Paper>
      </Box>
    </Box>
  );
}
