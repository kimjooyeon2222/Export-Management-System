import { RouterProvider } from 'react-router-dom';

// project imports
import router from 'routes';
import ThemeCustomization from 'themes';
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ScrollTop from 'components/ScrollTop';

// ==============================|| APP - THEME, ROUTER, LOCAL ||============================== //

// 🔥 모든 TextField disabled 글자 선명하게
const theme = createTheme({
  components: {
    MuiInputBase: {
      styleOverrides: {
        input: {
          "&.Mui-disabled": {
            WebkitTextFillColor: "#000 !important",  // 글씨 검정
            opacity: 1,                               // 흐리게 보이는 효과 제거
          },
        },
      },
    },
  },
});

export default function App() {
  return (
    <ThemeCustomization>
      <ThemeProvider theme={theme}>
        <ScrollTop>
          <RouterProvider router={router} />
        </ScrollTop>
      </ThemeProvider>
    </ThemeCustomization>
  );
}
