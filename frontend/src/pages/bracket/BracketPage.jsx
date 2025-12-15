// src/pages/bracket/BracketPage.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "api/apiFetch";

export default function BracketPage() {
      const [scheduleRows, setScheduleRows] = useState([]);
    
const [showStockPanel, setShowStockPanel] = useState(false);

    // ================================================
// 🔥 BRACKET 품번 기준으로 packing_list 합산하는 함수
// ================================================
async function calcBracketQty(invNo) {
  const API_BASE = import.meta.env.VITE_API_URL;

  try {
    // packing_list 불러오기 (특정 INV)
    const res = await apiFetch(`${API_BASE}/api/packing-list/by-inv/${invNo}`);
    const items = await res.json();

    let LH = 0;
    let RH = 0;

    items.forEach(item => {
      if (item.part_no === "55228-T00800") {
        LH += Number(item.qty || 0);
      }
      if (item.part_no === "55228-T00830") {
        RH += Number(item.qty || 0);
      }
    });

    return { LH, RH };

  } catch (err) {
    console.error("🚨 BRACKET qty 계산 오류:", err);
    return { LH: 0, RH: 0 };
  }
}


    // 🔥 페이지 로딩 시 DB에서 데이터 불러오기
useEffect(() => {
  const API_BASE = import.meta.env.VITE_API_URL;

  async function loadAll() {
    try {
      // 1) BRACKET 세팅 불러오기
      const settingRes = await apiFetch(`${API_BASE}/api/br-setting`);
      const setting = await settingRes.json();
      if (setting) {
        setWriter(setting.writer || "");
        setUsDate(setting.us_date || "");
        setTargetStock(setting.target_stock || 0);
      }

      
      // 2) BRACKET 인벤토리 불러오기
const invRes = await apiFetch(`${API_BASE}/api/br-inventory`);
const inv = await invRes.json();
if (Array.isArray(inv)) {
  setBracketRows(
    inv.map(row => ({
      ...row,
      target_stock: setting.target_stock || 0   // ⭐ 중요!
    }))
  );
}


      // 3) 스케줄 불러오기
      // 3) BRACKET 스케줄 불러오기 + qty 자동 적용
const schRes = await apiFetch(`${API_BASE}/api/br-schedule`);
const schedule = await schRes.json();

let updated = [];

for (const row of schedule) {
  // ETA/ETD 기반 상태 체크
  const status = getScheduleStatus(row.etd, row.eta);

  // 운항중일 때만 qty 계산
  let qty = { LH: 0, RH: 0 };
  if (status === "운항중") {
    qty = await calcBracketQty(row.inv_no);
  }

  updated.push({
    tempId: uuidv4(),
    ...row,
    bracket_LH: qty.LH,
    bracket_RH: qty.RH,
    status,
  });
}

setScheduleRows(updated);

   
    } catch (err) {
      console.error("🚨 로딩 오류:", err);
    }
  }

  loadAll();
}, []);

// 🔥 스케줄 로드 후 INV 기반 자동 데이터 로딩
useEffect(() => {
  if (scheduleRows.length === 0) return;

  scheduleRows.forEach(row => {
    if (row.inv_no) {
      handleAutoLoad(row.tempId, row.inv_no);
    }
  });
}, [scheduleRows.length]);

    // ⭐ 전체 저장 함수
const handleSave = async () => {
  if (!editMode) return;

  try {
    const API_BASE = import.meta.env.VITE_API_URL;

    // 1) BRACKET 세팅 저장 (작성자 / 날짜 / 적정재고)
    await apiFetch(`${API_BASE}/api/br-setting`, {
      method: "PUT",
      body: JSON.stringify({
        writer,
        us_date: usDate,
        target_stock: targetStock,
      }),
    });

    // 2) 각 품목(actual_stock) 저장
    for (const row of bracketRows) {
      await apiFetch(`${API_BASE}/api/br-inventory/${row.id}`, {
        method: "PUT",
        body: JSON.stringify({
          actual_stock: row.actual_stock,
        }),
      });
    }

    // 3) 스케줄 저장
    const schedulePayload = scheduleRows.map((row) => ({
      inv_no: row.inv_no,
    }));

    await apiFetch(`${API_BASE}/api/br-schedule/bulk`, {
      method: "POST",
      body: JSON.stringify(schedulePayload),
    });

    alert("저장 완료!");
    setEditMode(false);

  } catch (err) {
    console.error("🚨 저장 오류:", err);
    alert("저장 중 오류 발생");
  }
};

    // ★ 판단결과 박스 스타일 (AxleSub 동일)
const getStatusBoxStyle = (status) => {
  const map = {
    "초과":     { bg: "#EAD1DC", color: "#741B47" },  // 연한 보라톤
    "양호":     { bg: "#D9EAD3", color: "#38761D" },  // 연한 녹색
    "위험":     { bg: "#F4CCCC", color: "#990000" },  // 연한 빨강
    "적정재고미달": { bg: "#FCE5CD", color: "#B45F06" }, // 연한 주황톤
  };

  const s = map[status] || { bg: "#eee", color: "#333" };

  return {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "15px",
    backgroundColor: s.bg,
    color: s.color,
  };
};

    const bracketCompanyColors = {
  "디케이메탈": "#FFD966",
};
 
const getPeriod = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (day <= 10) return `${m}월 초`;
  if (day <= 20) return `${m}월 중순`;
  return `${m}월 말`;
};
  const navigate = useNavigate();

  /* ----------------------------------
        공통 유틸
  ---------------------------------- */

  const getContrastTextColor = (bgColor) => {
    if (!bgColor) return "#000";
    const r = parseInt(bgColor.substr(1, 2), 16);
    const g = parseInt(bgColor.substr(3, 2), 16);
    const b = parseInt(bgColor.substr(5, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000" : "#fff";
  };

  function parseKRDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, -9, 0, 0));
  }

  function parseUSDate(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 6, 0, 0));
  }

  function todayUS() {
    const nowUS = new Date().toLocaleString("en-US", {
      timeZone: "America/Chicago",
    });
    const d = new Date(nowUS);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const getForgingStatusStyle = (status) => {
    if (status === "입고완료") {
      return {
        bgcolor: "#d9f7be",
        color: "#237804",
        fontWeight: "bold",
        borderRadius: "6px",
        px: 1,
        display: "inline-block",
      };
    }
    if (status === "운항중") {
      return {
        bgcolor: "#ffe6f1",
        color: "#c41d7f",
        fontWeight: "bold",
        borderRadius: "6px",
        px: 1,
        display: "inline-block",
      };
    }
    if (status === "선적대기중") {
      return {
        bgcolor: "#d0e0e3",
        color: "#0b5394",
        fontWeight: "bold",
        borderRadius: "6px",
        px: 1,
        display: "inline-block",
      };
    }
    return {
      bgcolor: "#f4cccc",
      color: "#990000",
      fontWeight: "bold",
      borderRadius: "6px",
      px: 1,
      display: "inline-block",
    };
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return Number(num).toLocaleString();
  };

  const getScheduleStatus = (etd, eta) => {
    const today = todayUS();
    const etdKR = etd ? parseKRDate(etd) : null;
    const etaUS = eta ? parseUSDate(eta) : null;

    if (etaUS && etaUS <= today) return "입고완료";
    if (!eta || eta === "일정 없음") return "부산항 미입고";
    if (etdKR && etdKR > today) return "선적대기중";

    return "운항중";
  };

  /* ----------------------------------
        상태 관리
  ---------------------------------- */

  const [editMode, setEditMode] = useState(false);
  const [writer, setWriter] = useState("");
  const [usDate, setUsDate] = useState("");

  const [targetStock, setTargetStock] = useState(0);

  const [bracketRows, setBracketRows] = useState([
    {
      id: 1,
      company: "디케이메탈",
      item_name: "BRACKET-MTG; LH MCT",
      item_code: "55228-T00800",
      actual_stock: 0,
      target_stock: 0,
    },
    {
      id: 2,
      company: "디케이메탈",
      item_name: "BRACKET-MTG; RH MCT",
      item_code: "55228-T00830",
      actual_stock: 0,
      target_stock: 0,
    },
  ]);

  // 적정재고 수정 시 전체 행 반영
  useEffect(() => {
    setBracketRows((prev) =>
      prev.map((row) => ({
        ...row,
        target_stock: targetStock,
      }))
    );
  }, [targetStock]);

async function handleAutoLoad(tempId, invNo) {
  if (!invNo.trim()) return;

  const API_BASE = import.meta.env.VITE_API_URL;

  try {
    const res = await apiFetch(`${API_BASE}/api/br/auto-load/${invNo}`);
    const data = await res.json();

    if (data.error) return;

    const { etd, eta, status, qty_map } = data;

    // LH / RH 계산
    const LH = qty_map["55228-T00800"] || 0;
    const RH = qty_map["55228-T00830"] || 0;

    // scheduleRows 업데이트
    setScheduleRows(prev =>
      prev.map(row =>
        row.tempId === tempId
          ? {
              ...row,
              inv_no: invNo,
              etd,
              eta,
              status,
              bracket_LH: LH,
              bracket_RH: RH,
            }
          : row
      )
    );
  } catch (err) {
    console.error("🔥 BRACKET 자동로드 오류:", err);
  }
}
  const getStatus = (actual, target) => {
    if (actual >= target * 1.13) return "초과";
    if (actual >= target && actual > target * 0.96) return "양호";
    if (actual <= target * 0.7) return "위험";
    return "적정재고미달";
  };

  const statusColor = (status) => {
    switch (status) {
      case "초과":
        return "purple";
      case "양호":
        return "green";
      case "위험":
        return "red";
      case "적정재고미달":
        return "orange";
      default:
        return "black";
    }
  };

  /* ----------------------------------
        운항 스케줄
  ---------------------------------- */



  const addRow = () => {
    setScheduleRows((prev) => [
      ...prev,
      {
        tempId: uuidv4(),
        inv_no: "",
        etd: "",
        eta: "",
        bracket_LH: 0,
        bracket_RH: 0,
      },
    ]);
  };

  const deleteRow = () => {
    if (scheduleRows.length === 0) return;
    const last = scheduleRows[scheduleRows.length - 1].tempId;
    setScheduleRows((prev) => prev.filter((r) => r.tempId !== last));
  };

  const updateScheduleCell = (tempId, field, value) => {
    setScheduleRows((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, [field]: value } : row))
    );
  };

  /* ----------------------------------
        UI 렌더링
  ---------------------------------- */

  return (
    <Box sx={{ p: 3 }}>
      {/* 메인으로 */}
      <Box sx={{ mb: -4 }}>
        <Button
          variant="outlined"
          onClick={() => navigate("/")}
          sx={{
            borderColor: "#0069a6ff",
            color: "#0056a6ff",
            backgroundColor: "#ffffff",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "#ecfeffff",
              borderColor: "#0069a6ff",
              color: "#0085a6ff",
            },
          }}
        >
          ← 메인으로
        </Button>
      </Box>

      {/* 수정모드 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={() => setEditMode(!editMode)}
          sx={{
            borderColor: editMode ? "#d32f2f" : "#1976d2",
            color: editMode ? "#d32f2f" : "#1976d2",
            fontWeight: "bold",
          }}
        >
          {editMode ? "수정모드 종료" : "수정모드 활성화"}
        </Button>

        <Button
  variant="contained"
  disabled={!editMode}
  onClick={handleSave}
>
  저장
</Button>
      </Box>

      {/* 작성자 + 날짜 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 3 }}>
        <TextField
          label="작성자"
          size="small"
          value={writer}
          InputProps={{
            readOnly: !editMode,
            sx: {
              "& input": {
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
              },
            },
          }}
          InputLabelProps={{ shrink: true, sx: { fontSize: "15px", fontWeight: "bold" } }}
          onChange={(e) => editMode && setWriter(e.target.value)}
          sx={{ width: 130 }}
        />

        <TextField
          label="북미 기준 날짜 (YYYY-MM-DD)"
          size="small"
          value={usDate}
          InputProps={{
            readOnly: !editMode,
            sx: {
              "& input": {
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
              },
            },
          }}
          InputLabelProps={{ shrink: true, sx: { fontSize: "15px", fontWeight: "bold" } }}
          onChange={(e) => editMode && setUsDate(e.target.value)}
          sx={{ width: 170 }}
        />
      </Box>

      {/* 제목 */}
      {/* 제목 + 과부족 접기 버튼 */}
<Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 2,
  }}
>
  <Typography variant="h5" sx={{ fontSize: 18, fontWeight: "bold" }}>
    BRACKET 재고 및 운송 스케줄 관리
    {usDate ? ` (${getPeriod(usDate)})` : ""}
  </Typography>

  <Button
    size="small"
    variant="outlined"
    onClick={() => setShowStockPanel(!showStockPanel)}
    sx={{ fontSize: 14, fontWeight: "bold" }}
  >
    {showStockPanel ? "− 과부족 상태 접기" : "+ 과부족 상태표 보기"}
  </Button>
</Box>


      {/* =========================================
          과부족 상태표
          
      ========================================= */}
      {showStockPanel && (

      <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
        <Box sx={{ display: "flex", mb: 2, gap: 3 }}>
          <Typography sx={{ fontWeight: "bold", fontSize: 18 }}>
            ※ 과부족 상태 ※
          </Typography>
          
          {editMode ? (
            <TextField
              label="적정재고 기준"
              size="small"
              type="number"
              value={targetStock}
              onChange={(e) => setTargetStock(Number(e.target.value))}
              InputLabelProps={{ sx: { fontSize: "16px", fontWeight: "bold" } }}
              sx={{ width: 160 }}
            />
          ) : (
            <Typography sx={{ fontSize: 16, fontWeight: "bold", ml: 1, color: "#777" }}>
              적정재고 기준: {formatNumber(targetStock)}
            </Typography>
          )}
        </Box>

        <Table size="small" sx={{ "& *": { fontWeight: "bold", fontSize: "15px" } }}>
          <TableHead sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000" }}>
  <TableRow>
    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>업체명</TableCell>
    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>품명</TableCell>
    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>품번</TableCell>
    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>실사자료</TableCell>
    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>적정재고</TableCell>

    {/* ⭐ 추가되는 두 컬럼 */}
    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>운항중</TableCell>
    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>운항중 + 실사자료</TableCell>

    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>판단결과</TableCell>
  </TableRow>
</TableHead>


          <TableBody>
  {bracketRows.map((row) => {
    const actual = Number(row.actual_stock || 0);
    const target = Number(row.target_stock || 0);

    // ⭐ 운항중 qty 계산
    const inTransit = scheduleRows
      .filter(r => getScheduleStatus(r.etd, r.eta) === "운항중")
      .reduce((sum, r) => {
        if (row.item_code === "55228-T00800") return sum + (r.bracket_LH || 0);
        if (row.item_code === "55228-T00830") return sum + (r.bracket_RH || 0);
        return sum;
      }, 0);

    // ⭐ 운항중 + 실사자료
    const total = actual + inTransit;

    // ⭐ 판단결과는 total 기준
    const status = getStatus(total, target);

    return (
      <TableRow
  key={row.id}
  sx={{
    backgroundColor: status === "초과" ? "#fbeaea" : "inherit"
  }}
>

        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
          <Box
            sx={{
              display: "inline-block",
              px: 1.5,
              py: 0.4,
              borderRadius: "6px",
              fontWeight: "bold",
              bgcolor: bracketCompanyColors[row.company] || "#ddd",
              color: getContrastTextColor(bracketCompanyColors[row.company]),
            }}
          >
            {row.company}
          </Box>
        </TableCell>

        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{row.item_name}</TableCell>
        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{row.item_code}</TableCell>

        {/* 실사자료 */}
        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{formatNumber(actual)}</TableCell>

        {/* 적정재고 */}
        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{formatNumber(target)}</TableCell>

        {/* ⭐ 운항중 */}
        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{formatNumber(inTransit)}</TableCell>

        {/* ⭐ 운항중 + 실사자료 */}
        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{formatNumber(total)}</TableCell>

        {/* ⭐ 판단결과 */}
        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
          <Box sx={getStatusBoxStyle(status)}>{status}</Box>
        </TableCell>
      </TableRow>
    );
  })}
</TableBody>

        </Table>
      </Paper>
)}

      {/* =========================================
          운항 스케줄
      ========================================= */}
      <Paper sx={{ p: 2, mb: 4, border: "2px solid #777" }}>
        <Typography sx={{ fontWeight: "bold", fontSize: 18, mb: 2 }}>
          ※ 운송 스케줄 현황 ※
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            size="small"
            disabled={!editMode}
            onClick={addRow}
          >
            + 행추가
          </Button>

          <Button
            variant="contained"
            color="error"
            size="small"
            disabled={!editMode}
            onClick={deleteRow}
          >
            - 행삭제
          </Button>
        </Box>

        <Table size="small" sx={{ mt: 2 }}>
          <TableHead>

  {/* 🔥 1행: LH/RH 위에만 디케이메탈 헤더 */}
  <TableRow sx={{ bgcolor: "#ffffff !important" }}>
    <TableCell colSpan={4} />  {/* INV / ETD / ETA / 상태 → 빈칸 */}
    
    <TableCell
      colSpan={2}
      align="center"
      sx={{
        fontWeight: "bold",
        fontSize: "16px",
        bgcolor: "#FFD966",
        color: getContrastTextColor("#FFD966"),
        borderBottom: "2px solid #b7b7b7"
      }}
    >
      디케이메탈
    </TableCell>
  </TableRow>

  {/* 🔥 2행: 기존 품명 헤더 */}
  <TableRow sx={{ bgcolor: "#ffe599", borderTop: "2px solid #000" }}>
    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
      INV#
    </TableCell>
    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
      ETD
    </TableCell>
    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
      ETA
    </TableCell>
    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
      상태
    </TableCell>
    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
      LH MCT
    </TableCell>
    <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
      RH MCT
    </TableCell>
  </TableRow>

</TableHead>


          <TableBody>
            {scheduleRows.map((row) => (
              <TableRow key={row.tempId}>
                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                  {editMode ? (
                    <TextField
                      size="small"
                      value={row.inv_no}
                     onChange={(e) => {
  const value = e.target.value;
  updateScheduleCell(row.tempId, "inv_no", value);
  handleAutoLoad(row.tempId, value);   // ★ 자동 불러오기 실행
}}
                      sx={{ width: 90 }}
                    />
                  ) : (
                    row.inv_no
                  )}
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>{row.etd}</TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                  {getScheduleStatus(row.etd, row.eta) === "운항중" ? (
                    <Box sx={getForgingStatusStyle("운항중")}>{row.eta}</Box>
                  ) : (
                    row.eta
                  )}
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                  <Box sx={getForgingStatusStyle(getScheduleStatus(row.etd, row.eta))}>
                    {getScheduleStatus(row.etd, row.eta)}
                  </Box>
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                  {formatNumber(row.bracket_LH)}
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "15px" }}>
                  {formatNumber(row.bracket_RH)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
