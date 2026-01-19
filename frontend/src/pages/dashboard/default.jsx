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

//table imports
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';


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
  // 🔥 도착일정 요약 데이터
  const [arrivalSummary, setArrivalSummary] = useState([]);
  useEffect(() => {
    apiFetch(`${API_BASE}/api/dashboard/arrival-summary`)
      .then(res => res.json())
      .then(data => {
        setArrivalSummary(data);
      })
      .catch(err => {
        console.error("도착일정 요약 로딩 실패:", err);
      });
  }, []);

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
            display: "flex",
            alignItems: "flex-start",   // Y축 중앙

          }}
        >
          {/* ⭐ row 자체를 X축 중앙 + 시각 보정 */}
          <Grid
            container
            spacing={3}
            sx={{
              maxWidth: "100%",   // ✅ 화면 꽉 채움
              mx: "auto",
              px: 3,           // ✅ 좌우 패딩만 유지
              pl: 9,
              mt: 15,
            }}
          >


            {/* 🔹 LEFT : 메모 */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", mb: 2 }}
              >
                업데이트
              </Typography>

              <MainCard
                sx={{
                  minHeight: 450,
                  p: 3,
                  position: "relative",

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
                    width: "100%",       // ✅ 고정폭 제거
                    maxWidth: 520,       // ✅ 너무 커지지만 않게 (원하면 560까지)
                    height: 350,
                    backgroundColor: "#FFF8C6",
                    border: "1px solid #E5D884",
                    borderRadius: "8px",
                    position: "relative",
                    mx: "auto",          // ✅ 가운데 유지
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
                    variant="h5"
                    sx={{
                      textAlign: "center",
                      fontWeight: "bold",
                      mb: 2,
                      mt: 3.5,
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


            {/* 🔹 RIGHT : 도착일정 요약 */}
            <Grid item xs={12} md={6}>
              {/* ✅ 헤더 + 우측 상단 단위(고정) */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  mb: 2
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  도착일정 요약
                </Typography>

                <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#555" }}>
                  단위 : 건
                </Typography>
              </Box>

              <MainCard
                sx={{
                  minHeight: 450,
                  maxHeight: 450,
                  p: 1,
                  width: "900px",
                  display: "flex",
                  alignItems: "center",      //  Y축 중앙
                  justifyContent: "center",  //  X축 중앙
                }}
              >
                <TableContainer sx={{
                  width: "100%", maxHeight: 330,        // ⭐ 헤더 + 5행 기준
                  overflowY: "auto",

                }}>

                  <Table size="medium" stickyHeader>
                    {/* ✅ 표 헤더(고정) */}
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#FFF2CC" }}>
                        {[
                          "도착일정 (공장)",
                          "건수",
                          "TOOL",
                          "EV-SUB",
                          "단조소재",
                          "오일",
                          "설비",
                          "건설자재"
                        ].map((h) => (
                          <TableCell
                            key={h}
                            align="center"
                            sx={{
                              fontWeight: 800, fontSize: "1rem", py: 2.3, px: 3, bgcolor: "#FFF2CC",   // ⭐ 헤더 배경 유지
                              position: "sticky",   // ⭐ 핵심
                              top: 0,               // ⭐ 핵심
                              zIndex: 2
                            }}
                          >
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    {/* ✅ 표 내용(지금은 더미, 나중에 연동하면 여기만 바뀜) */}
                    <TableBody>
                      {arrivalSummary.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            align="center"
                            sx={{
                              py: 8,
                              fontSize: "1.05rem",
                              fontWeight: 700,
                              color: "#888",
                            }}
                          >
                            현재 공항 도착 일정 없음
                          </TableCell>
                        </TableRow>
                      ) : (
                        arrivalSummary.map((r, idx) => (
                          <TableRow
                            key={idx}
                            sx={{ "& td": { fontSize: "1rem", py: 2, px: 4.5 } }}
                          >
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                              {r.date}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                              {r.total}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                              {r["TOOL"] || ""}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                              {r["EV-SUB"] || ""}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                              {r["단조소재"] || ""}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                              {r["오일"] || ""}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                              {r["설비"] || ""}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                              {r["건설자재"] || ""}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>


                  </Table>
                </TableContainer>
              </MainCard>
            </Grid>

          </Grid>
        </Box>
      </Grid>
    </Grid>
  );
}
