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
    { label: '공구대차(종료)', color: '#8E24AA' },
    { label: '수출품 사진', color: '#2E7D32' }
  ];

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 */}
      <Grid sx={{ mb: -2.25 }} size={12}>
        <Typography variant="h5">수출통합관리 시스템</Typography>
      </Grid>
    {/* ✅ EMS 버튼 섹션 (비율 유지형, 축소 시도에도 일정한 간격 유지) */}
    <Grid item xs={12}>
      <MainCard sx={{ mt: 2.5, p: 3, textAlign: 'center', width:'100%', maxWidth:'none', margin:'0 auto', position: 'relative' }}>
        {/* 제목 + 날짜 */}
        <Box sx={{ position: 'relative', mb: 4 }}>
          <Typography
            variant="h5"
            align="center"
            sx={{
              fontWeight: 'bold',
              fontSize: '1.5rem',
              mb: 2,
              mt: 1
            }}
          >
            ※ 수출현황 바로가기 ※
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 'bold',
              position: 'absolute',
              right: '0%',
              top: '-30px',
              fontSize: '1rem',
              color: 'text.secondary'
            }}
          >
           {today.toLocaleDateString()}

            
           </Typography>
        </Box>

        {/* 버튼 그룹 */}
        <Grid
          container
          spacing={2}
          justifyContent="center"
          alignItems="center"
          sx={{
            width: '100%',
            mx: 'auto',
          }}
        >
          {emsButtons.map((btn, i) => (
            <Grid item xs={6} sm={3} md={3} lg={1.5} key={i}>
              <Button
                variant="contained"
                fullWidth //  버튼이 Grid 셀 비율에 맞게 자동 확장
                onClick={() => {
                 if (btn.label === 'INVOICE TRK') {
                   navigate('/invoice'); // invoice 페이지로 이동
                 } 
                  else if (btn.label === '단조품') {
                     navigate('/forging');   //  단조품 페이지로 이동
                 } 
                  else if (btn.label === '오일') {
                     navigate('/oil-schedule');   // 오일 운송일정 페이지로 이동
                 }
                 else if (btn.label === 'AXLE서브품') {
                     navigate('/axle-sub');   // AXLE 서브 페이지로 이동
                 }
                 else if (btn.label === 'EV서브품') {
                     navigate('/ev-sub');
                 }
                 else if (btn.label === '브라켓') {
                     navigate('/bracket');
                 }

                 else {
                   alert(`${btn.label} 페이지는 준비 중입니다.`);
                 }
               }}
                sx={{
                  backgroundColor: btn.color,
                  color: btn.textColor || '#fff',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  height: 55,
                  boxShadow: '0 3px 6px rgba(0,0,0,0.2)',
                  '&:hover': {
                    opacity: 0.9,
                    backgroundColor: btn.color
                  }
                }}
              >
                {btn.label}
              
              </Button>
        </Grid>
          ))}
        </Grid>
      </MainCard>
  

</Grid>

     
     

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
