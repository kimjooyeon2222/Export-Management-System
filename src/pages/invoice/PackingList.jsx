import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';

export default function PackingList() {
  const { inv } = useParams();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [userRole] = useState('admin'); // ✅ 실제 로그인 로직과 연동 가능

  // ✅ LocalStorage 불러오기 (INV별 저장된 데이터)
  const savedData = JSON.parse(localStorage.getItem(`packing_${inv}`) || '[]');
  const [rows, setRows] = useState(
    savedData.length
      ? savedData
      : [
          {
            id: 1,
            po: '450001',
            vendor: '와이엠',
            partNo: 'A10U8741',
            partName: 'M5 X 14 BOLT ASSY',
            spec: 'Ø110×Ø140(M42×3P)',
            qty: 196000
          },
          {
            id: 2,
            po: '45000223',
            vendor: '와이엠',
            partNo: 'A10U8742',
            partName: 'M5 X 16 BOLT ASSY',
            spec: 'Ø90×Ø140(M60×3P)',
            qty: 132000
          }
        ]
  );

  // ✅ LocalStorage 자동 저장 (INV별)
  useEffect(() => {
    localStorage.setItem(`packing_${inv}`, JSON.stringify(rows));

    // === Invoice Page 연동용 전체 packingListData 갱신 ===
    const allKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith('packing_')
    );

    let allPacking = [];
    allKeys.forEach((key) => {
      const invKey = key.replace('packing_', '');
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      data.forEach((row) => {
        allPacking.push({ inv: invKey, po: row.po });
      });
    });

    // 전체 데이터 통합 저장 (InvoicePage에서 불러오기용)
    localStorage.setItem('packingListData', JSON.stringify(allPacking));
  }, [rows, inv]);

  // ✅ 행 추가
  const handleAdd = () => {
    const newRow = {
      id: rows[rows.length - 1]?.id + 1 || 1,
      po: '',
      vendor: '',
      partNo: '',
      partName: '',
      spec: '',
      qty: 0
    };
    setRows([...rows, newRow]);
  };

  // ✅ 행 수정
  const handleEdit = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // ✅ 행 삭제
  const handleDelete = (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <Box sx={{ bgcolor: '#fff', height: '100vh', p: 3 }}>
      {/* 제목 */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        📦 PACKING LIST - {inv}
      </Typography>

      {/* 상단 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{
            borderColor: '#b34b00',
            color: '#b34b00',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#fff2e0' }
          }}
        >
          ← INVOICE로 돌아가기
        </Button>

        {/* 관리자 전용 버튼 */}
        {userRole === 'admin' && (
          <Box sx={{ display: 'flex', gap: 1 }}>
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
                    alert('✅ 수정 모드가 종료되었습니다.\n표는 다시 읽기 전용이 됩니다.');
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
      </Box>

      {/* 테이블 */}
      <Paper
        elevation={2}
        sx={{
          maxHeight: '65vh',
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 8 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: 4 }
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: '#fff3cd' }}>
            <TableRow>
              {['ID', 'PO 번호', '거래처', '품번', '품명', '규격', '수량(EA)'].map((col) => (
                <TableCell key={col} align="center" sx={{ fontWeight: 'bold' }}>
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={row.id} sx={{ bgcolor: i % 2 === 0 ? '#ffffff' : '#f8f8f8' }}>
                {['id', 'po', 'vendor', 'partNo', 'partName', 'spec', 'qty'].map((field, idx) => (
                  <TableCell
                    key={idx}
                    align="center"
                    sx={{ cursor: isEditMode && userRole === 'admin' ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (!isEditMode || userRole !== 'admin') return;
                      const value = prompt(`${field} 수정`, String(row[field] || ''));
                      if (value !== null) handleEdit(row.id, field, value);
                    }}
                  >
                    {field === 'qty' ? Number(row[field]).toLocaleString() : row[field]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
