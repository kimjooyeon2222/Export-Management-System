import React, { useState } from 'react';
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

  const today = new Date();
  const getDateOffset = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const rows = [
    {
      id: 301,
      exporter: '오토텍',
      inv: 'ATT-SUP-20250707-V1',
      amount: '$34,070.40',
      item: 'TOOL',
      cont: 'RFCU2295502',
      bl: 'WIU525070633',
      etd: getDateOffset(-10),
      eta: getDateOffset(-3),
      delayed: getDateOffset(-2),
      count: '3일',
      note: '도착완료 데이터'
    },
    {
      id: 302,
      exporter: '오토텍',
      inv: 'ATT-SUP-20250707-V2',
      amount: '$34,070.40',
      item: 'TOOL',
      cont: 'RFCU2295502',
      bl: 'WIU525070633',
      etd: getDateOffset(-7),
      eta: getDateOffset(0),
      delayed: getDateOffset(0),
      count: '1일',
      note: '금일 도착분'
    },
    {
      id: 303,
      exporter: '오토텍',
      inv: 'ATT-SUP-20250707-V3',
      amount: '$34,070.40',
      item: 'TOOL',
      cont: 'RFCU2295502',
      bl: 'WIU525070633',
      etd: getDateOffset(-5),
      eta: getDateOffset(3),
      delayed: getDateOffset(3),
      count: '2일',
      note: '5일 이내 도착 예정'
    },
    {
      id: 304,
      exporter: '오토텍',
      inv: 'ATT-SUP-20250707-V4',
      amount: '$34,070.40',
      item: 'TOOL',
      cont: 'RFCU2295502',
      bl: 'WIU525070633',
      etd: getDateOffset(-15),
      eta: getDateOffset(8),
      delayed: getDateOffset(8),
      count: '11일',
      note: '지연일수 10일 이상 경고'
    }
  ];

  const handleSearch = () => {
    if (poNumber === '4500001303') setSearchResult(shipment);
    else setSearchResult(null);
  };

  const parseDate = (str) => new Date(str);

  const filteredRows = rows.filter((r) => {
    if (!showUpcoming) return true;
    const etaDate = parseDate(r.eta);
    const diffETA = Math.floor((etaDate - today) / (1000 * 60 * 60 * 24));
    // 빨간 배경 조건: 오늘 이후 도착 (0일 초과)
    return diffETA > 0;
  });

  return (
    <Box sx={{ bgcolor: '#fff', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 타이틀 */}
      <Typography
        variant="h6"
        sx={{ fontWeight: 'bold', color: 'black', fontSize: '1.3rem', pl: 3, pt: 2 }}
      >
        수출일정 통합관리부
      </Typography>

      {/* 상단 헤더 */}
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
          ← 메인으로 돌아가기
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

        {/* 오른쪽 버튼 */}
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
          </Typography>{' '}
          <Typography component="span" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
            (5일전)
          </Typography>
        </Button>
      </Box>

      {/* 본문 */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 상단: 검색결과 + 수출자/품목 */}
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
            {searchResult ? (
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
                  <TableRow>
                    <TableCell align="center">{searchResult.exporter}</TableCell>
                    <TableCell align="center">{searchResult.inv}</TableCell>
                    <TableCell align="center">{searchResult.cont}</TableCell>
                    <TableCell align="center">{searchResult.bl}</TableCell>
                    <TableCell align="center">{searchResult.etd}</TableCell>
                    <TableCell align="center">{searchResult.eta}</TableCell>
                    <TableCell align="center">{searchResult.factory}</TableCell>
                    <TableCell align="center" sx={{ color: 'red', fontWeight: 'bold' }}>
                      {searchResult.arrival}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <Typography sx={{ textAlign: 'center', color: '#888' }}>검색 결과가 없습니다.</Typography>
            )}
          </Box>

          {/* 오른쪽 수출자/품목 */}
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

        {/* 하단 표 */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 2 }}>
          <Paper elevation={2}>
            <Table size="small" stickyHeader>
              <TableHead sx={{ bgcolor: '#ffda66' }}>
                <TableRow>
                  {[
                    'NO',
                    'EXPORTER',
                    'INV#',
                    'INV# 금액',
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
                  ].map((header, idx) => (
                    <TableCell key={idx} align="center" sx={{ fontWeight: 'bold', color: '#333' }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredRows.map((row, i) => {
                  const etaDate = parseDate(row.eta);
                  const diffETA = Math.floor((etaDate - today) / (1000 * 60 * 60 * 24));
                  const countValue = parseInt(row.count.replace('일', '')) || 0;

                  let delayedStyle = {};
                  if (diffETA < 0) delayedStyle = { bgcolor: '#d6eaff' };
                  else if (diffETA === 0)
                    delayedStyle = { bgcolor: '#ffe0b2', color: '#e65100', fontWeight: 'bold' };
                  else if (diffETA > 0 && diffETA <= 5)
                    delayedStyle = { bgcolor: '#ffcccc', color: '#b71c1c', fontWeight: 'bold' };
                  else delayedStyle = { bgcolor: '#ffcccc' };

                  const countStyle =
                    countValue >= 10 ? { bgcolor: '#ccf2e0', color: 'red', fontWeight: 'bold' } : {};

                  const rowBgColor = i % 2 === 0 ? '#fff5e6' : '#ffffff';

                  return (
                    <TableRow key={row.id} sx={{ bgcolor: rowBgColor }}>
                      <TableCell align="center">{row.id}</TableCell>
                      <TableCell align="center">{row.exporter}</TableCell>
                      <TableCell
                        align="center"
                        sx={{ color: '#1565c0', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        {row.inv}
                      </TableCell>
                      <TableCell align="center">{row.amount}</TableCell>
                      <TableCell align="center">{row.item}</TableCell>
                      <TableCell align="center">{row.cont}</TableCell>
                      <TableCell align="center">{row.bl}</TableCell>
                      <TableCell align="center">{row.etd}</TableCell>
                      <TableCell align="center">{row.eta}</TableCell>
                      <TableCell align="center" sx={delayedStyle}>
                        {row.delayed}
                      </TableCell>
                      <TableCell align="center" sx={countStyle}>
                        {row.count}
                      </TableCell>
                      <TableCell align="center">X</TableCell>
                      <TableCell align="center">{row.note}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
