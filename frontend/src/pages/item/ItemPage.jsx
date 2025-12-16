import { Box, Typography, Paper } from '@mui/material';

export default function ItemPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        품목관리
      </Typography>

      <Paper sx={{ p: 2 }}>
        품목 목록 / 등록 / 수정 화면
      </Paper>
    </Box>
  );
}
