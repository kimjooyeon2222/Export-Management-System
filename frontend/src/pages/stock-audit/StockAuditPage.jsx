import { Box, Typography, Paper } from '@mui/material';

export default function StockAuditPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        재고실사
      </Typography>

      <Paper sx={{ p: 2 }}>
        재고 실사 관리 화면
      </Paper>
    </Box>
  );
}
