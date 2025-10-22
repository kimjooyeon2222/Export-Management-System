// material-ui
import { useTheme } from '@mui/material/styles';

// ==============================|| LOGO ICON SVG ||============================== //

export default function LogoIcon() {
  return (
    <img
      src="/images/EMS_icon.png"
      alt="EMS Logo"
      width={100}     // 필요에 따라 크기 조정
      height="auto"
      style={{
        display: 'block',
        margin: 'auto',
      }}
    />
  );
}