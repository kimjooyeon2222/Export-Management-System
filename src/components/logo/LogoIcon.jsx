// material-ui
import { useTheme } from '@mui/material/styles';

// ==============================|| LOGO ICON SVG ||============================== //
export default function LogoIcon() {
  return (
    <img
      src="/assets/images/EMS_icon_2.jpg"
      alt="EMS Logo"
      style={{
        width: '40px',      // ✅ 원하는 크기로 조정 (예: 60~100px)
        height: 'auto',     // 비율 유지
        display: 'block',
        margin: 'auto',
      }}
    />
  );
}
