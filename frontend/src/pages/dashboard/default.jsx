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
import { apiFetch } from "api/apiFetch";


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

  const [userDate, setUserDate] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [note, setNote] = useState("");
  const [redPen, setRedPen] = useState(false);

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ hardBreak: false }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      HardBreak.extend({
        addKeyboardShortcuts() {
          return { Enter: () => this.editor.commands.setHardBreak() };
        },
      }),
    ],
    content: note,
    editable: editMode,
    onUpdate({ editor }) {
      setNote(editor.getHTML());
    },
  });

  useEffect(() => {
    apiFetch(`${API_BASE}/memo`)
      .then((res) => res.json())
      .then((data) => {
        if (data.text) setNote(data.text);
        if (data.user_date) setUserDate(data.user_date);
      })
      .catch((err) => console.error("메모 로딩 실패:", err));
  }, []);

  useEffect(() => {
    if (editor && !editMode) editor.commands.setContent(note);
  }, [note, editor, editMode]);

  useEffect(() => {
    if (editor) editor.setEditable(editMode);
  }, [editMode, editor]);

  const saveMemo = async () => {
    try {
      await apiFetch(`${API_BASE}/memo`, {
        method: "POST",
        body: JSON.stringify({
          text: note,
          user_date: userDate,
        }),
      });
    } catch (error) {
      console.error("메모 저장 실패:", error);
    }
  };

  return (
    <Grid container>
      {/* =================== ROW 1 : 메인 대시보드 =================== */}
      <Grid item xs={12}>
        <Box
          sx={{
            minHeight: "calc(100vh - 120px)", // 상단 AppBar 고려
            display: "flex",
            alignItems: "center",   // Y축 중앙
          }}
        >
          {/* ⭐ row 자체를 X축 중앙 + 시각 보정 */}
          <Grid
            container
            spacing={3}
            sx={{
              maxWidth: 1200,
              mx: "auto",   // X축 중앙
              pl: 4,        // ⭐ 사이드바 고려한 시각 중심 보정
            }}
          >
            {/* 🔹 LEFT : 메모 */}
            <Grid item xs={12} md={7}>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", mb: 2 }}
              >
                수출통합관리 시스템
              </Typography>

              <MainCard
                sx={{
                  minHeight: 450,
                  p: 3,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {!editMode ? (
                  <Button
                    variant="outlined"
                    onClick={() => setEditMode(true)}
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 15,
                      minWidth: 35,
                      p: "3px",
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => {
                      saveMemo();
                      setEditMode(false);
                    }}
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 15,
                      minWidth: 35,
                      p: "3px",
                    }}
                  >
                    <SaveIcon fontSize="small" />
                  </Button>
                )}

                {/* 📝 메모 박스 */}
                <Box
                  sx={{
                    p: 4,
                    width: 500,
                    height: 350,
                    backgroundColor: "#FFF8C6",
                    border: "1px solid #E5D884",
                    borderRadius: "8px",
                    position: "relative",
                  }}
                >
                  {!editMode ? (
                    <Typography
                      variant="subtitle2"
                      sx={{
                        position: "absolute",
                        right: 20,
                        top: 15,
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                      }}
                    >
                      {userDate || "날짜 없음"}
                    </Typography>
                  ) : (
                    <Box sx={{ position: "absolute", right: 20, top: 15 }}>
                      <input
                        value={userDate}
                        onChange={(e) => setUserDate(e.target.value)}
                      />
                    </Box>
                  )}

                  <Typography
                    variant="h6"
                    sx={{
                      textAlign: "center",
                      fontWeight: "bold",
                      mb: 2,
                      mt: 1,
                    }}
                  >
                    # 업데이트 내용 #
                  </Typography>

                  {!editMode ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: note }}
                      style={{ fontSize: "1.1rem", fontWeight: 600 }}
                    />
                  ) : (
                    <>
                      <Button
                        variant={redPen ? "contained" : "outlined"}
                        sx={{
                          mb: 1,
                          borderColor: "#d32f2f",
                          color: redPen ? "#fff" : "#d32f2f",
                          backgroundColor: redPen ? "#d32f2f" : "transparent",
                        }}
                        onClick={() => {
                          setRedPen(!redPen);
                          editor
                            .chain()
                            .setColor(redPen ? "black" : "#d32f2f")
                            .run();
                        }}
                      >
                        빨간펜
                      </Button>

                      <EditorContent editor={editor} />
                    </>
                  )}
                </Box>
              </MainCard>
            </Grid>

            {/* 🔹 RIGHT : Income Overview */}
            <Grid item xs={12} md={5}>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", mb: 2 }}
              >
                Income Overview
              </Typography>

              <MainCard
                sx={{
                  minHeight: 450,
                  p: 3,
                }}
              >
                <MonthlyBarChart />
              </MainCard>
            </Grid>
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
}
