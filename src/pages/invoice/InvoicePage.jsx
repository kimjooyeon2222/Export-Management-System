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
  Paper,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function InvoicePage() {
  const navigate = useNavigate();
  const [poNumber, setPoNumber] = useState('');
  const [searchResult, setSearchResult] = useState(null);

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

  const rows = Array.from({ length: 30 }, (_, i) => ({
    id: 300 + i,
    exporter: '오토텍',
    inv: `ATT-SUP-20250707-V${i + 1}`,
    amount: '$34,070.40',
    item: 'TOOL',
    cont: 'RFCU2295502',
    bl: 'WIU525070633',
    etd: '2025-07-12',
    eta: '08월 18일',
    delayed: '08월 18일',
    count: '0일',
    note: '테스트 데이터'
  }));

  const handleSearch = () => {
    if (poNumber === '4500001303') setSearchResult(shipment);
    else setSearchResult(null);
  };

  return (
    <Box sx={{ bgcolor: '#fff', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 헤더 */}
      <Box
        sx={{
          bgcolor: '#b34b00',
          color: 'white',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          수출일정 통합관리부
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            SHINHWA | PO 검색
          </Typography>
          <TextField
            variant="outlined"
            size="small"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="4500001303"
            sx={{ bgcolor: 'white', borderRadius: 1 }}
          />
          <Button
            variant="contained"
            sx={{
              bgcolor: '#ffcc00',
              color: 'black',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#ffb300' }
            }}
            onClick={handleSearch}
          >
            🔍
          </Button>
        </Box>
      </Box>

      {/* 메인 콘텐츠 */}
      <Box sx={{ display: 'flex', flex: 1, p: 2, gap: 2 }}>
        {/* 왼쪽: 검색결과 (3/2 비율) */}
        <Box
          sx={{
            flex: 2,
            border: '1px solid #ccc',
            borderRadius: 1,
            p: 2,
            overflowY: 'auto',
            maxHeight: '50vh'
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

        {/* 오른쪽: 필터 버튼 영역 (1/3 비율, 2열 구성) */}
        <Box
          sx={{
            flex: 1,
            p: 1
          }}
        >
          <Grid container spacing={2}>
            {/* 왼쪽: 수출자 */}
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                수출자
              </Typography>
              {['모텍', '오토텍', '이엔지', '정공'].map((item) => (
                <Button
                  key={item}
                  variant="contained"
                  fullWidth
                  sx={{
                    mb: 1,
                    bgcolor: '#f5c374',
                    color: '#4b2e05',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                    '&:hover': { bgcolor: '#e9a43c' }
                  }}
                >
                  {item}
                </Button>
              ))}
            </Grid>

            {/* 오른쪽: 품목구분 */}
            <Grid item xs={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                품목구분
              </Typography>
              {['EV-SUB', 'TOOL', '건설자재', '단조소재', '설비', '오일'].map((item) => (
                <Button
                  key={item}
                  variant="contained"
                  fullWidth
                  sx={{
                    mb: 1,
                    bgcolor: '#66b2b2',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                    '&:hover': { bgcolor: '#559c9c' }
                  }}
                >
                  {item}
                </Button>
              ))}
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* 하단 테이블 */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <Paper elevation={2}>
          <Table size="small" stickyHeader>
            <TableHead sx={{ bgcolor: '#ffda66' }}>
              <TableRow>
                {[
                  'NO',
                  'EXPORTER',
                  'INV#',
                  'INV$ 금액',
                  '품목구분',
                  'CONT#',
                  'BL#',
                  'ETD',
                  'ETA(공항도)',
                  'DELAYED DATE',
                  'COUNT',
                  '비고'
                ].map((header) => (
                  <TableCell key={header} align="center" sx={{ fontWeight: 'bold', color: '#333' }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.id} sx={{ bgcolor: i % 2 === 0 ? '#fffef2' : '#ffffff' }}>
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
                  <TableCell align="center">{row.delayed}</TableCell>
                  <TableCell align="center">{row.count}</TableCell>
                  <TableCell align="center">{row.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      {/* 하단 버튼 */}
      <Box sx={{ p: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          sx={{ color: '#b34b00', borderColor: '#b34b00', fontWeight: 'bold' }}
        >
          ← 메인으로 돌아가기
        </Button>
      </Box>
    </Box>
  );
}
