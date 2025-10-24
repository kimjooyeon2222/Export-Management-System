import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';

export default function PackingList() {
  const { inv } = useParams(); // URL 파라미터로부터 INV 번호 가져오기
  const navigate = useNavigate();

  // ✅ 샘플 데이터 (나중에 DB 연결 시 실제 데이터로 교체)
  const packingData = {
    'ATT-SUP-20250707-V1': [
      { po: '450001', part: 'M5 X 14 BOLT ASSY', qty: 196000 },
      { po: '450002', part: 'M5 X 16 BOLT ASSY', qty: 120000 }
    ],
    'ATT-SUP-20250707-V2': [
      { po: '450003', part: 'WASHER 10MM', qty: 54000 },
      { po: '450004', part: 'NUT M5', qty: 76000 }
    ],
    'ATT-SUP-20250707-V3': [
      { po: '450005', part: 'SCREW 8X20', qty: 23000 }
    ]
  };

  // ✅ 해당 INV의 PACKING LIST 데이터 찾기
  const currentData = packingData[inv] || [];

  return (
    <Box sx={{ bgcolor: '#fff', height: '100vh', p: 3 }}>
      {/* 상단 타이틀 */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        📦 PACKING LIST - {inv}
      </Typography>

      {/* 메인으로 돌아가기 버튼 */}
      <Button
        variant="outlined"
        onClick={() => navigate(-1)}
        sx={{
          mb: 2,
          borderColor: '#b34b00',
          color: '#b34b00',
          fontWeight: 'bold',
          '&:hover': { bgcolor: '#fff2e0' }
        }}
      >
        ← INVOICE로 돌아가기
      </Button>

      {/* PACKING LIST 표 */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#ffeeba' }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>PO 번호</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>품명</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>수량</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((item, i) => (
                <TableRow key={i}>
                  <TableCell align="center">{item.po}</TableCell>
                  <TableCell align="center">{item.part}</TableCell>
                  <TableCell align="center">{item.qty.toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell align="center" colSpan={3}>
                  ❌ 해당 INV에 대한 Packing List 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
