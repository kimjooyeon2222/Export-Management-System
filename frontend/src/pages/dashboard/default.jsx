// material-ui
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';


// project imports
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import MonthlyBarChart from 'sections/dashboard/default/MonthlyBarChart';
import ReportAreaChart from 'sections/dashboard/default/ReportAreaChart';
import UniqueVisitorCard from 'sections/dashboard/default/UniqueVisitorCard';
import SaleReportCard from 'sections/dashboard/default/SaleReportCard';
import OrdersTable from 'sections/dashboard/default/OrdersTable';

// assets
import GiftOutlined from '@ant-design/icons/GiftOutlined';
import MessageOutlined from '@ant-design/icons/MessageOutlined';
import SettingOutlined from '@ant-design/icons/SettingOutlined';

import avatar1 from 'assets/images/users/avatar-1.png';
import avatar2 from 'assets/images/users/avatar-2.png';
import avatar3 from 'assets/images/users/avatar-3.png';
import avatar4 from 'assets/images/users/avatar-4.png';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

// avatar style
const avatarSX = {
  width: 36,
  height: 36,
  fontSize: '1rem'
};

// action style
const actionSX = {
  mt: 0.75,
  ml: 1,
  top: 'auto',
  right: 'auto',
  alignSelf: 'flex-start',
  transform: 'none'
};



// ==============================|| DASHBOARD - DEFAULT ||============================== //

export default function DashboardDefault() {
const API_BASE = import.meta.env.VITE_API_URL;

const [editMode, setEditMode] = useState(false);
const [note, setNote] = useState("");

// ⭐ 페이지 로드시 메모 불러오기
useEffect(() => {
  fetch(`${API_BASE}/memo`)
    .then(res => res.json())
    .then(data => {
      if (data.text) setNote(data.text);
    })
    .catch(err => console.error("메모 로딩 실패:", err));
}, []);

// ⭐ 저장 함수
const saveMemo = async () => {
  try {
    await fetch(`${API_BASE}/memo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: note })
    });

    alert("저장 완료!");
  } catch (error) {
    console.error("메모 저장 실패:", error);
  }
};

  const today =  new Date();
  const navigate = useNavigate();

  // EMS 버튼 데이터
  const emsButtons = [
    { label: 'INVOICE TRK', color: '#4A4A4A' },
    { label: '단조품', color: '#D32F2F' },
    { label: '오일', color: '#FBC02D', textColor: '#000' },
    { label: 'AXLE서브품', color: '#FDD835', textColor: '#000' },
    { label: 'EV서브품', color: '#43A047' },
    { label: '브라켓', color: '#1976D2' },
    { label: '수출품 사진', color: '#8E24AA' }
  ];

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 */}
      <Grid sx={{ mb: -2.25 }} size={12}>
        <Typography variant="h5">수출통합관리 시스템</Typography>
      </Grid>
    {/* ✅ EMS 버튼 섹션 (비율 유지형, 축소 시도에도 일정한 간격 유지) */}
    <Grid item xs={12}>

   
      <MainCard
  sx={{
    mt: 5.5,
    p: 3,
    width: "100%",        // 가로 전체
    maxWidth: "1500px",   // ✨ 넓히기 (원하는 값으로 늘려도 됨: 1300px, 1500px 가능)
    mx: "auto",           // 가운데 정렬
    textAlign: 'center',
    position: 'relative'
  }}
>

 {/* 🔥 작은 수정 버튼 / 저장 버튼 */}
  {!editMode ? (
    <Button
      variant="outlined"
      onClick={() => {
 
  setEditMode(true);
}}
      sx={{
        position: 'absolute',
        top: '10px',
        right: '15px',
        minWidth: '35px',
        padding: '3px',
        borderColor: '#1976D2',
        color: '#1976D2',
        borderRadius: '6px',
      }}
    >
      <EditIcon fontSize="small" />
    </Button>
  ) : (
    <Button
      variant="contained"
      onClick={() => {
  saveMemo();   // ⭐ DB 저장
  setEditMode(false);
}}
      sx={{
        position: 'absolute',
        top: '10px',
        right: '15px',
        minWidth: '35px',
        padding: '3px',
        backgroundColor: '#1976D2',
        borderRadius: '6px',
      }}
    >
      <SaveIcon fontSize="small" />
    </Button>
  )}
 {/* ✨ 메모장 영역 (수정모드 지원) */}
<Box
  sx={{
    mt: 2.5,
    p: 4,
    width: '700px',
    height: "350px",

    backgroundColor: '#FFF8C6',
    border: '1px solid #E5D884',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'relative',
    textAlign: 'left'
  }}
>

  {/* 날짜 */}
  <Typography
    variant="subtitle2"
    sx={{
      position: 'absolute',
      right: '20px',
      top: '15px',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      color: '#5C5C5C'
    }}
  >
    {today.toLocaleDateString()} (한국현지시각)
  </Typography>

  {/* 제목 */}
  <Typography
    variant="h6"
    sx={{
      fontWeight: 'bold',
      mb: 2,
      mt: 3,
      textAlign: 'center'
    }}
  >
    #업데이트 내용#
  </Typography>

  {/* 📌 수정모드 여부 */}
  {editMode ? (
    <>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        style={{
          width: '100%',
          height: '180px',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #CCC',
          fontSize: '1rem',
          lineHeight: '1.4',
          resize: 'vertical'
        }}
      />

      {/* 저장 버튼 */}
      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 2, backgroundColor: '#1976D2', fontWeight: 'bold' }}
        onClick={() => {
  saveMemo();   // ⭐ DB 저장
  setEditMode(false);
}}
      >
        저장하기
      </Button>
    </>
  ) : (
    <>
      {/* 보기 모드 */}
      <Typography
        variant="body1"
        sx={{
          whiteSpace: 'pre-line',
          fontSize: '1rem',
          lineHeight: '1.6'
        }}
      >
        {note}
      </Typography>

      
    </>
  )}

</Box>


  </MainCard>
</Grid>

     
     
<Grid container rowSpacing={4.5} columnSpacing={2.75}>

      {/* row 2 */}
      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <UniqueVisitorCard />
      </Grid>
      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid>
            <Typography variant="h5">Income Overview</Typography>
          </Grid>
        </Grid>
        <MainCard sx={{ mt: 2 }} content={false}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack sx={{ gap: 2 }}>
              <Typography variant="h6" color="text.secondary">
                This Week Statistics
              </Typography>
              <Typography variant="h3">$7,650</Typography>
            </Stack>
          </Box>
          <MonthlyBarChart />
        </MainCard>
      </Grid>

      {/* row 3 */}
      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid>
            <Typography variant="h5">Recent Orders</Typography>
          </Grid>
        </Grid>
        <MainCard sx={{ mt: 2 }} content={false}>
          <OrdersTable />
        </MainCard>
      </Grid>

      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid>
            <Typography variant="h5">Analytics Report</Typography>
          </Grid>
          </Grid>
        </Grid>
        <MainCard sx={{ mt: 2 }} content={false}>
          <List sx={{ p: 0, '& .MuiListItemButton-root': { py: 2 } }}>
            <ListItemButton divider>
              <ListItemText primary="Company Finance Growth" />
              <Typography variant="h5">+45.14%</Typography>
            </ListItemButton>
            <ListItemButton divider>
              <ListItemText primary="Company Expenses Ratio" />
              <Typography variant="h5">0.58%</Typography>
            </ListItemButton>
            <ListItemButton>
              <ListItemText primary="Business Risk Cases" />
              <Typography variant="h5">Low</Typography>
            </ListItemButton>
          </List>
          <ReportAreaChart />
        </MainCard>
      </Grid>

      {/* row 4 */}
      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <SaleReportCard />
      </Grid>
      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid>
            <Typography variant="h5">Transaction History</Typography>
          </Grid>
        </Grid>
        {/* 아래 부분은 기존 그대로 */}
        <MainCard sx={{ mt: 2 }} content={false}>
          <List
            component="nav"
            sx={{
              px: 0,
              py: 0,
              '& .MuiListItemButton-root': {
                py: 1.5,
                px: 2,
                '& .MuiAvatar-root': avatarSX,
                '& .MuiListItemSecondaryAction-root': { ...actionSX, position: 'relative' }
              }
            }}
          >
            <ListItem component={ListItemButton} divider>
              <ListItemAvatar>
                <Avatar sx={{ color: 'success.main', bgcolor: 'success.lighter' }}>
                  <GiftOutlined />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={<Typography variant="subtitle1">Order #002434</Typography>} secondary="Today, 2:00 AM" />
            </ListItem>
          </List>
        </MainCard>
      </Grid>
    </Grid>
  );
}
