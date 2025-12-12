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
import { useEditor, EditorContent } from "@tiptap/react";
// TipTap imports
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import HardBreak from "@tiptap/extension-hard-break";


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
const [redPen, setRedPen] = useState(false);

// TipTap Editor 초기화
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      // paragraph 절대 끄지 말 것!
      hardBreak: false
    }),
    TextStyle,
    Color.configure({ types: ['textStyle'] }),

    HardBreak.extend({
      addKeyboardShortcuts() {
        return {
          Enter: () => this.editor.commands.setHardBreak(),
        };
      },
    }),
  ],
  content: note,
  editable: editMode,
  onUpdate({ editor }) {
    setNote(editor.getHTML());
  }
});



useEffect(() => {
  if (editor && !editMode) {
    editor.commands.setContent(note);
  }
}, [note, editor, editMode]);

useEffect(() => {
  if (editor) {
    editor.setEditable(editMode);
  }
}, [editMode, editor]);

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
    width: '650px',
    height: "350px",
    mx:"auto",
    backgroundColor: '#FFF8C6',
    border: '1px solid #E5D884',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'relative',
    textAlign: 'left',
    
    
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
      mt: -1.5,
      textAlign: 'center',
      fontSize: "18px"
    }}
  >
    # 업데이트 내용 #
  </Typography>

  {/* 보기모드 */}
  {/* 보기 모드 */}
{!editMode && (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",   // 가로 가운데
      alignItems: "flex-start",
      
      mt: 1,
    }}
  >
    <div
      dangerouslySetInnerHTML={{ __html: note }}
      style={{
        display: "inline-block",     // 내용 박스를 가운데에 고정
        textAlign: "left",
        fontSize: "1.3rem",
        lineHeight: "1.75rem",
        fontWeight: 600,             // 굵게
        whiteSpace: "pre-line",
      }}
    />
  </Box>
)}


  {/* 수정모드 */}
  {editMode && (
    <>
      {/* 🔥 빨간펜 토글 버튼 */}
<Box sx={{ display: "flex", width: "100%" }}>
  <Button
    variant={redPen ? "contained" : "outlined"}
    sx={{
      ml: "auto",      // 🔥 flex에서만 작동
      mb: 1,
      borderColor: "#d32f2f",
      color: redPen ? "#fff" : "#d32f2f",
      backgroundColor: redPen ? "#d32f2f" : "transparent",
    }}
    onClick={() => {
      setRedPen(!redPen);
      if (!redPen) editor.chain().setColor("#d32f2f").run();
      else editor.chain().setColor("black").run();
    }}
  >
    빨간펜
  </Button>
</Box>


      {/* 에디터 */}
      <Box
          sx={{
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "12px",
    backgroundColor: "#fff",
    height: "180px",
    overflowY: "auto",

    // 🔥 줄 간격 문제 해결 핵심
    "& p": {
      margin: 0,     // 기본 마진 제거
    },

    "& p + p": {
      marginTop: "4px", // Enter 시 줄바꿈 간격 최소화 (원하면 2px~6px 조절 가능)
    }
  }}
      >
        <EditorContent editor={editor} />
      </Box>

      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 2, backgroundColor: '#1976D2', fontWeight: 'bold' }}
        onClick={() => {
          saveMemo();
          setEditMode(false);
        }}
      >
        저장하기
      </Button>
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
      
        </Grid>
    
      </Grid>

      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          
          </Grid>
        </Grid>
        
      </Grid>

     
      
    </Grid>
  );
}
