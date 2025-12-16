import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Box
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useState, useEffect } from "react";
import { Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const ALL_ROW = { code: "", name: "전체" };

/* ===================== 데이터 ===================== */
export const ITEM_KIND_LIST = [
  { code: "110", name: "SHAFT류" },
  { code: "111", name: "SHAFT ASSY" },
  { code: "115", name: "INNER-SHAFT ASSY" },
  { code: "117", name: "INNER-SHAFT(단품)" },
  { code: "118", name: "SUB ASSY 조립" },
  { code: "120", name: "HOUSING류" },
  { code: "130", name: "OUTERACE류" },
  { code: "133", name: "INNER-RACE" },
  { code: "135", name: "HUB" },
  { code: "140", name: "CUP류" },
  { code: "150", name: "PLATE류" },
  { code: "155", name: "PISTON류" },
  { code: "160", name: "COVER류" },
  { code: "170", name: "KNUCKLE류" },
  { code: "175", name: "HYPOID GEAR" },
  { code: "176", name: "PINION SHAFT" },
  { code: "180", name: "가공조립류" },
  { code: "212", name: "TORQUE 가공" },
  { code: "310", name: "TORQUE ASSY" },
  { code: "200", name: "캘리퍼류" },
  { code: "201", name: "캘리퍼(주물)" },
  { code: "213", name: "CAL 가공(양산)" },
  { code: "214", name: "CAL 가공(CKD)" },
  { code: "215", name: "CAL 가공(A/S)" },
  { code: "216", name: "CAL 조립(양산)" },
  { code: "217", name: "CAL 조립(CKD)" },
  { code: "218", name: "CAL 조립(A/S)" },
  { code: "219", name: "CAL 조립(군수)" },
  { code: "220", name: "BMC류" },
  { code: "223", name: "BMC 가공(양산)" },
  { code: "224", name: "BMC 가공(CKD)" },
  { code: "225", name: "BMC 가공(A/S)" },
  { code: "226", name: "BMC 조립(양산)" },
  { code: "227", name: "BMC 조립(CKD)" },
  { code: "228", name: "BMC 조립(A/S)" },
  { code: "229", name: "BMC 조립(군수)" },
  { code: "230", name: "BMC 조립(피스톤 SUB-ASSY)" },
  { code: "231", name: "BMC 조립(피스톤 SUB-양산)" },
  { code: "232", name: "CAL 조립(토크멤버 SUB-양산)" },
  { code: "240", name: "IDA" },
  { code: "250", name: "DRIVE AXLE ASSY" },
  { code: "260", name: "GEAR-SET" },
  { code: "270", name: "T/HSG" },
  { code: "280", name: "O/RACE" },
  { code: "290", name: "I/RACE" },
  { code: "300", name: "CAGE" },
  { code: "310A", name: "DIFF-PINION" },
  { code: "320", name: "DIFF SIDE" },
  { code: "400", name: "수입검사(IQC)" },
  { code: "410", name: "세척품" },
  { code: "500", name: "보전자재" },
  { code: "510", name: "소모품" },
  { code: "900", name: "기타" },
  { code: "9999", name: "공구" },
  { code: "LCA", name: "탄소배출관리항목" }
];

/* ===================== 컴포넌트 ===================== */
export default function ItemKindPicker({
    
  value,
  onSelect,

  /* 🔥 추가 (선택적) */
  open: externalOpen,
  onClose
}) 

{
  /* ===== 내부 상태 (기존 유지) ===== */
  const [internalOpen, setInternalOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(null);

  /* ===== 실제 open 결정 ===== */
  const dialogOpen = externalOpen ?? internalOpen;

  /* ===== value 동기화 ===== */
  useEffect(() => {
    if (value) {
      const found = ITEM_KIND_LIST.find(v => v.code === value);
      setSelected(found || null);
    }
  }, [value]);

  /* ===== 닫기 공통 처리 ===== */
  const handleClose = () => {
    setKeyword("");
    setSelected(null);

    if (onClose) onClose();
    else setInternalOpen(false);
  };

  /* ===== 필터 ===== */
  const filtered = ITEM_KIND_LIST.filter(
    v =>
      v.name.includes(keyword) ||
      v.code.includes(keyword)
  );

  return (
    <>
      {/* 🔍 기존 행 수정용 돋보기 (그대로 유지) */}
      {externalOpen === undefined && (
        <IconButton
          size="small"
          onClick={() => {
            setInternalOpen(true);
            if (value) {
              const found = ITEM_KIND_LIST.find(v => v.code === value);
              setSelected(found || null);
            }
          }}
        >
          <SearchIcon />
        </IconButton>
      )}

      {/* ================= Dialog ================= */}
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    pr: 1
  }}
>
  품목유형 선택
  <IconButton onClick={handleClose}>
    <CloseIcon />
  </IconButton>
</DialogTitle>


        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="코드 또는 품목유형명 검색"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ maxHeight: 400, overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">코드</TableCell>
                  <TableCell>품목유형명</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[ALL_ROW, ...filtered].map(row => (

                  <TableRow
                    key={row.code}
                    hover
                    sx={{
                      cursor: "pointer",
                      bgcolor:
                        selected?.code === row.code
                          ? "#e3f2fd"
                          : "inherit"
                    }}
                    onClick={() => setSelected(row)}
                    onDoubleClick={() => {
                      onSelect(row);
                      handleClose();
                    }}
                  >
                    <TableCell align="center">{row.code}</TableCell>
                    <TableCell>{row.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* 저장 버튼 */}
          <Box
  sx={{
    display: "flex",
    justifyContent: "flex-end",
    mt: 2
  }}
>
  <Button
    variant="contained"
    size="small"
    disabled={!selected}
    onClick={() => {
      onSelect(selected);
      handleClose();
    }}
  >
    저장
  </Button>
</Box>

        </DialogContent>
      </Dialog>
    </>
  );
}
