// material-ui
import Box from '@mui/material/Box';

export default function AuthBackground() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        backgroundColor: '#ffffff',
        overflow: 'hidden'
      }}
    >
      <Box
        component="img"
        src="/assets/images/EMS_icon.jpg"
        alt="Shinhwa Background"
        sx={{
          position: 'absolute',
          top: '52%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '85%',
          maxWidth: '1200px',

          opacity: 0.18,        // 🔥 보이게 하는 핵심
          filter: 'blur(12px)', // 🔥 너무 안 흐리게

          userSelect: 'none',
          pointerEvents: 'none'
        }}
      />
    </Box>
  );
}
