import React, { useState, useEffect } from 'react';
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
  const navigate = useNavigate();
  const [poNumber, setPoNumber] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [userRole] = useState('admin');
// === 상단에 추가 ===
  const [isEditMode, setIsEditMode] = useState(false);

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

  // 기본 데이터
  const [rows, setRows] = useState([
    {
      id: 301,
      exporter: '오토텍',
      inv: 'ATT-SUP-20250707-V1',
      po: 'PO-450001',
      amount: '$34,070.40',
      item: 'TOOL',
      cont: 'RFCU2295502',
      bl: 'WIU525070633',
      etd: getDateOffset(-2),
      eta: getDateOffset(-3),
      delayed: getDateOffset(12),
      count: '3일',
      needsHelp: 'X',
      note: '도착완료 데이터'
    },
    {
      id: 302,
      exporter: '오토텍',
      inv: 'ATT-SUP-20250707-V2',
      po: 'PO-450002',
      amount: '$34,070.40',
      item: 'TOOL',
      cont: 'RFCU2295502',
      bl: 'WIU525070633',
      etd: getDateOffset(-7),
      eta: getDateOffset(0),
      delayed: getDateOffset(0),
      count: '1일',
      needsHelp: 'X',
      note: '금일 도착분'
    },
    {
      id: 303,
      exporter: '오토텍',
      inv: 'ATT-SUP-20250707-V3',
      po: 'PO-450003',
      amount: '$34,070.40',
      item: 'TOOL',
      cont: 'RFCU2295502',
      bl: 'WIU525070633',
      etd: getDateOffset(-5),
      eta: getDateOffset(3),
      delayed: getDateOffset(3),
      count: '2일',
      needsHelp: '△',
      note: '5일 이내 도착 예정'
    },
    {
      id: 304,
      exporter: '오토텍',
      inv: 'ATT-SUP-20250707-V4',
      po: 'PO-450004',
      amount: '$34,070.40',
      item: 'TOOL',
      cont: 'RFCU2295502',
      bl: 'WIU525070633',
      etd: getDateOffset(-15),
      eta: getDateOffset(8),
      delayed: getDateOffset(8),
      count: '11일',
      needsHelp: 'X',
      note: '지연일수 10일 이상 경고'
    }
  ]);

  // CRUD 기능
  const handleAdd = () => {
    const newRow = {
      id: rows[rows.length - 1]?.id + 1 || 1,
      exporter: '신규',
      inv: 'NEW-INV',
      po: 'PO-NEW',
      amount: '$0.00',
      item: 'NEW ITEM',
      cont: 'NEW-CONT',
      bl: 'NEW-BL',
      etd: getDateOffset(0),
      eta: getDateOffset(2),
      delayed: getDateOffset(2),
      count: '0일',
      needsHelp: '-',
      note: '신규 데이터'
    };
    setRows([...rows, newRow]);
  };

  const handleEdit = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
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

  const handleSearch = () => {
  const allPacking = JSON.parse(localStorage.getItem("packingListData") || "[]");
  const allInvoice = JSON.parse(localStorage.getItem("invoiceData") || "[]");

  if (!poNumber.trim()) {
    alert("PO 번호를 입력하세요.");
    return;
  }

  // 🔹 입력값 정규화
  const input = poNumber.trim().replace(/[^0-9A-Za-z]/g, "").toLowerCase();

  // 🔹 PO 완전 일치 or 부분 포함 둘 다 허용
  const matchedPacking = allPacking.filter((r) => {
    const poValue = String(r.po || "").trim().replace(/[^0-9A-Za-z]/g, "").toLowerCase();
    return poValue === input || poValue.includes(input);
  });

  if (matchedPacking.length === 0) {
    alert("❌ 검색 결과가 없습니다.");
    setSearchResult(null);
    return;
  }

  // 🔹 invoice 데이터와 병합 (INV 기준)
const mergedResults = matchedPacking.map((p) => {
  const invMatch = allInvoice.find((i) => i.inv === p.inv);
  return { ...p, ...invMatch };
});

// INV 중복 제거 (중복 INV는 1개만 표시)
const uniqueByInv = mergedResults.filter(
  (item, index, self) => index === self.findIndex((r) => r.inv === item.inv)
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
      return r.exporter === selectedExporter && r.item === selectedItem;
    } else if (selectedExporter) {
      return r.exporter === selectedExporter;
     } else if (selectedItem) {
      return r.item === selectedItem;
    }

    // 아무 것도 선택 안했을 때 전체 표시
    return true;
  });

// 한국시간(ETD용)
const getKoreaDate = (dateStr) =>
  new Date(new Date(dateStr).toLocaleString("en-US", { timeZone: "Asia/Seoul" }));

// 미국 앨라배마 시간(ETA, 공장도착일용)
const getAlabamaDate = (dateStr) =>
  new Date(new Date(dateStr).toLocaleString("en-US", { timeZone: "America/Chicago" }));

// Packing List 연동 자동 업데이트
useEffect(() => {
  const updateFromPackingList = () => {
    const stored = localStorage.getItem('packingListData');
    if (!stored) return;
    const list = JSON.parse(stored);

    // INV별로 PO 묶기 + 중복 제거
    const grouped = list.reduce((acc, cur) => {
      if (!acc[cur.inv]) acc[cur.inv] = new Set();
      acc[cur.inv].add(cur.po);
      return acc;
    }, {});

    // INV별로 쉼표로 표시된 PO 목록 생성
    const formatted = Object.entries(grouped).map(([inv, poSet]) => ({
      inv,
      poList: Array.from(poSet).join(', ')
    }));

    // Invoice 행 업데이트
    setRows((prev) => {
      const updated = [...prev];

      formatted.forEach((f) => {
        const existing = updated.find((r) => r.inv === f.inv);
        if (existing) {
          // 기존 INV 업데이트
          existing.po = f.poList;
        } else {
          // 없으면 새 INV 행 추가
          updated.push({
            id: updated.length + 1,
            exporter: '오토텍',
            inv: f.inv,
            po: f.poList,
            amount: '$0.00',
            item: 'TOOL',
            cont: '-',
            bl: '-',
            etd: getDateOffset(0),
            eta: getDateOffset(0),
            delayed: getDateOffset(0),
            count: '0일',
            needsHelp: '-',
            note: 'PACKING LIST 연동 자동 추가'
          });
        }
      });

      return updated;
    });
  };
  // 페이지 진입 시마다 최신 데이터 로드
  updateFromPackingList();
}, [location.pathname]); // 🔥 경로가 바뀔 때마다 다시 실행됨

// InvoicePage 데이터를 localStorage에도 저장 (검색결과 상세정보용)
useEffect(() => {
  localStorage.setItem('invoiceData', JSON.stringify(rows));
}, [rows]);

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
      <Box sx={{ flex: '0 0 37%', display: 'flex', p: 2, gap: 2 }}>
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
  // invoiceData에서 INV# 일치하는 행 찾기
  const invoiceData = JSON.parse(localStorage.getItem('invoiceData') || '[]');
  const matched = invoiceData.find((r) => r.inv === row.inv);

  // 실제 데이터 병합
  const merged = { ...row, ...matched };

  // 하단 표(Invoice Data)에서 delayed, eta, etd 값 불러오기
  const etd = merged.etd || '-';
  const eta = merged.eta || '-';
  const delayed = merged.delayed || '-';

  // 도착 여부 계산 (ETA vs 공장도착일, 둘 다 미국시간 기준)
  const etaUS = getAlabamaDate(eta);
  const factoryUS = getAlabamaDate(delayed); // delayed = 공장 도착일

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
        onClick={() => window.location.assign(`/packing-list/${merged.inv}`)}
      >
        {merged.inv}
      </TableCell>

      {/* 하단 표 데이터 그대로 연동 */}
      <TableCell align="center">{merged.cont || '-'}</TableCell>
      <TableCell align="center">{merged.bl || '-'}</TableCell>
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
            onClick={() => {
              const id = prompt('삭제할 ID를 입력하세요:');
              if (id) handleDelete(Number(id));
            }}
          >
            삭제
          </Button>
        </Box>
      )}

      {/* 하단 표 */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 2 }}>
        <Paper elevation={2}>
          <Table size="small" stickyHeader>
            <TableHead sx={{ bgcolor: '#ffda66' }}>
              <TableRow>
                {[
                  'NO',
                  <TableCell
  key="poHeader"
  align="center"
  sx={{
    
    fontSize: '1px',
    letterSpacing: '-1px', 
    fontWeight: 'bold',
    maxWidth:0,
    minWidth:0,
    width: 0,
    padding: 0,
    border: 'none',
    color: 'transparent',
    backgroundColor: 'transparent'
  }}
>
  발주번호 (PO)
</TableCell>,
                  'EXPORTER',
                  'INV#',
                  'INV 금액',
                  '품목구분',
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
    // ETD는 한국시간, ETA/DELAYED는 미국시간 기준
    const etdDate = getKoreaDate(row.etd);
    const etaDate = getAlabamaDate(row.eta);
    const delayedDate = getAlabamaDate(row.delayed);

    const diffDays = Math.floor((delayedDate - etaDate) / (1000 * 60 * 60 * 24)); // ✅ 날짜 차이 계산

    const countText = `${diffDays}일`; // COUNT 컬럼 표시용

    // 배경/경고 색상 계산 로직
    const diffETA = Math.floor((etaDate - today) / (1000 * 60 * 60 * 24));
    const countNum = diffDays;

    let delayedStyle = {};
    if (diffETA < 0) delayedStyle = { bgcolor: '#d6eaff' };
    else if (diffETA === 0)
      delayedStyle = { bgcolor: '#ffe0b2', color: '#e65100', fontWeight: 'bold' };
    else if (diffETA > 0 && diffETA <= 5)
      delayedStyle = { bgcolor: '#ffcccc', color: '#b71c1c', fontWeight: 'bold' };
    else delayedStyle = { bgcolor: '#ffcccc' };

    const countStyle =
  countNum >= 10
    ? { bgcolor: '#ccf2e0', color: 'red', fontWeight: 'bold' } // 🔥 10일 이상 → 빨강 글씨만 표시
    : { bgcolor: 'white', color: 'black', fontWeight: 'normal' }; // ⚪ 기본은 흰색


    const rowBg = i % 2 === 0 ? '#fff5e6' : '#ffffff';

    return (
      <TableRow key={row.id} sx={{ bgcolor: rowBg }}>
        {[
          row.id,
          row.po,
          row.exporter,
          row.inv,
          row.amount,
          row.item,
          row.cont,
          row.bl,
          row.etd,
          row.eta,
          row.delayed,
          countText, // 여기서 계산된 값 표시
          row.needsHelp,
          row.note
        ].map((val, idx) => (
          <TableCell
            key={idx}
            align="center"
            sx={{
              ...(idx === 1 && {
                
  fontSize: '1px',
  letterSpacing: '-1px', // 문자를 거의 0폭으로 압축
  width: 0,
  maxWidth:0,
  minWidth:0,
  padding: 0,
  border: 'none',
  color: 'transparent',
  backgroundColor: 'transparent'
}),
              ...(idx === 3 && { color: 'blue', cursor: 'pointer', textDecoration: 'underline' }),
              ...(idx === 10 ? delayedStyle : {}), // delayed 스타일
              ...(idx === 11 ? countStyle : {}), // count 스타일 적용
              ...(userRole === 'admin' && { cursor: 'pointer' })
            }}
            onClick={() => {
              // INV 클릭 시 링크 이동
              if (idx === 3 && !isEditMode) return navigate(`/packing-list/${row.inv}`);

              if (userRole === 'admin' && isEditMode) {
                const value = prompt('값 수정', String(val || ''));
                if (value !== null) {
                  const keys = [
                    'id',
                    'po',
                    'exporter',
                    'inv',
                    'amount',
                    'item',
                    'cont',
                    'bl',
                    'etd',
                    'eta',
                    'delayed',
                    'count',
                    'needsHelp',
                    'note'
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
