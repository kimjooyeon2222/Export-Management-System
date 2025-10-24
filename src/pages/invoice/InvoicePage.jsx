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

export default function InvoicePage() {
  const navigate = useNavigate();
  const [poNumber, setPoNumber] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [userRole] = useState('admin');
// === 상단에 추가 ===
  const [isEditMode, setIsEditMode] = useState(false);

  const today = new Date();
  const getDateOffset = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  // ✅ 기본 데이터
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
      etd: getDateOffset(-10),
      eta: getDateOffset(-3),
      delayed: getDateOffset(-2),
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

  // ✅ CRUD 기능
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

  // 입력된 PO번호 포함된 행 필터
  const result = allPacking.filter((r) => r.po.includes(poNumber));

  if (result.length > 0) {
    setSearchResult(result);
  } else {
    setSearchResult(null);
  }
  };

  const parseDate = (str) => new Date(str);

  const filteredRows = rows.filter((r) => {
    if (!showUpcoming) return true;
    const etaDate = parseDate(r.eta);
    const diffETA = Math.floor(
      (etaDate - today) / (1000 * 60 * 60 * 24)
    );
    return diffETA > 0;
  });
// ✅ Packing List 연동 자동 업데이트
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
    setRows((prev) =>
      prev.map((row) => {
        const match = formatted.find((f) => f.inv === row.inv);
        return match ? { ...row, po: match.poList } : row;
      })
    );
  };

  // ✅ 페이지 진입 시마다 최신 데이터 로드
  updateFromPackingList();
}, [location.pathname]); // 🔥 경로가 바뀔 때마다 다시 실행됨

// ✅ InvoicePage 데이터를 localStorage에도 저장 (검색결과 상세정보용)
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
            overflowY: 'auto'
          }}
        >
        {searchResult && searchResult.length > 0 ? (
  <Table size="small">
    <TableHead sx={{ bgcolor: '#f9f9f9' }}>
      <TableRow>
        {['수출자', 'INV#', 'CONT#', 'BL#', 'ETD', 'ETA', '공장도', '도착여부'].map((col) => (
          <TableCell key={col} align="center" sx={{ fontWeight: 'bold' }}>
            {col}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>

    <TableBody>
      {searchResult.map((row, i) => {
        const factory = '공장도착';
        const arrival = '도착';

        // ✅ 실제 저장된 Invoice 데이터와 매칭해서 상세정보 가져오기
        const invoiceRow = JSON.parse(localStorage.getItem('invoiceData') || '[]').find(
          (r) => r.inv === row.inv
        );

        return (
          <TableRow key={i}>
            <TableCell align="center">{row.exporter || invoiceRow?.exporter || '오토텍'}</TableCell>

            {/* ✅ INV 클릭 시 패킹리스트 이동 */}
            <TableCell
              align="center"
              sx={{
                color: 'blue',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: 'bold'
              }}
              onClick={() => window.location.assign(`/packing-list/${row.inv}`)}
            >
              {row.inv}
            </TableCell>

            {/* ✅ 나머지 상세정보 표시 */}
            <TableCell align="center">{invoiceRow?.cont || '-'}</TableCell>
            <TableCell align="center">{invoiceRow?.bl || '-'}</TableCell>
            <TableCell align="center">{invoiceRow?.etd || '-'}</TableCell>
            <TableCell align="center">{invoiceRow?.eta || '-'}</TableCell>
            <TableCell align="center">{factory}</TableCell>
            <TableCell align="center" sx={{ color: 'green', fontWeight: 'bold' }}>
              {arrival}
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

        {/* 오른쪽 수출자 / 품목 버튼 */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', p: 1 }}>
          <Box sx={{ flex: 1, mr: 1 }}>
            <Typography sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>수출자</Typography>
            {['모텍', '오토텍', '이엔지', '정공'].map((exp) => (
              <Button
                key={exp}
                fullWidth
                sx={{
                  mb: 1,
                  bgcolor: '#f5c374',
                  color: '#4b2e05',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': { bgcolor: '#e9a43c' }
                }}
              >
                {exp}
              </Button>
            ))}
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>품목구분</Typography>
            {['EV-SUB', 'TOOL', '건설자재', '단조소재', '설비', '오일'].map((cat) => (
              <Button
                key={cat}
                fullWidth
                sx={{
                  mb: 1,
                  bgcolor: '#66b2b2',
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': { bgcolor: '#559c9c' }
                }}
              >
                {cat}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      {/* 관리자용 버튼 */}
      {userRole === 'admin' && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, pb: 1 }}>
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
                  '발주번호',
                  'EXPORTER',
                  'INV#',
                  'INV 금액',
                  '품목구분',
                  'CONT#',
                  'BL#',
                    <Box key="etdHeader" sx={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
                      ETD<br />(출발 예정 시간)
                    </Box>,
                    <Box key="etaHeader" sx={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
                      ETA<br />(공장 도착 시간)
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
                const etaDate = parseDate(row.eta);
                const diffETA = Math.floor((etaDate - today) / (1000 * 60 * 60 * 24));
                const countNum = parseInt(row.count.replace('일', '')) || 0;

                let delayedStyle = {};
                  if (diffETA < 0) delayedStyle = { bgcolor: '#d6eaff' };
                  else if (diffETA === 0)
                    delayedStyle = { bgcolor: '#ffe0b2', color: '#e65100', fontWeight: 'bold' };
                  else if (diffETA > 0 && diffETA <= 5)
                    delayedStyle = { bgcolor: '#ffcccc', color: '#b71c1c', fontWeight: 'bold' };
                  else delayedStyle = { bgcolor: '#ffcccc' };
               

                const countStyle = countNum >= 10 ? { bgcolor: '#ccf2e0', color: 'red' } : {};
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
                      row.count,
                      row.needsHelp,
                      row.note
                    ].map((val, idx) => (
                      <TableCell
                        key={idx}
                        align="center"
                        sx={{
                           ...(idx === 3 && { color: 'blue', cursor: 'pointer', textDecoration: 'underline' }), // INV 열만 파란색 + 링크 효과
                           ...(idx === 10 ? delayedStyle : {}), // delayed 스타일
                           ...(idx === 11 ? countStyle : {}), // count 스타일
                           ...(userRole === 'admin' && { cursor: 'pointer' })
                        }}
                        onClick={() => {
                         // ✅ INV(4번째 열) 클릭 시 — 수정 모드가 아닐 때만 페이지 이동
                         if (idx === 3) {
                          if (!isEditMode) {
                            navigate(`/packing-list/${row.inv}`);
                          } else {
                            // 수정 모드일 때는 페이지 이동 대신 수정 가능하도록 함
                            const value = prompt('INV 값을 수정하세요:', String(val || ''));
                            if (value !== null) handleEdit(row.id, 'inv', value);
                          }
                          return; // 아래 코드 실행 방지
                        }

                        // ✅ 나머지 셀: 관리자 + 수정 모드일 때만 편집 가능
                        if (userRole !== 'admin' || !isEditMode) return;
                        const value = prompt('값 수정', String(val || ''));
                        if (value !== null) {
                          const keys = [
                            'id', 'po', 'exporter', 'inv', 'amount', 'item', 'cont', 'bl',
                            'etd', 'eta', 'delayed', 'count', 'needsHelp', 'note'
                          ];
                          handleEdit(row.id, keys[idx], value);
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
