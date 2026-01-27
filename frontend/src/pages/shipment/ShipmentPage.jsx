import React, { useState, useMemo, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    TextField,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    Select,
    MenuItem
} from "@mui/material";
import { borderLeft, borderRight } from "@mui/system";

/* ============================
   항목 정의
============================ */
const DOMESTIC_ITEMS = [
    "터미널 핸들링비(THC)",
    "부두사용료(WFG)",
    "부두보안료(FPS)",
    "씰 자물쇠 고정장치(SEAL CHG)",
    "서류비(DOC)",
    "부대 내 컨테이너 적재비(CFS CHG)",
    "바인딩 비용(SHORING CHG)",
    "AMS 전송료",
    "통관료",
    "보험료"
];

const US_ITEMS = ["미국 운송료", "통관료", "ISF파일"];

const ROUTE_LABEL = {
    SAVANNAH: "BUSAN → SAVANNAH",
    MOBILE: "BUSAN → MOBILE",
    LA: "BUSAN → LA"
};

export default function ShipmentPage() {
    const [editMode, setEditMode] = useState(false);
    const [route, setRoute] = useState("SAVANNAH");
    const [month, setMonth] = useState(12);
    const [exchangeRate, setExchangeRate] = useState(1470);
    const [usDate, setUsDate] = useState("2025-12-01");

    /* 날짜 → 월 연동 */
    useEffect(() => {
        if (!usDate) return;
        const [, m] = usDate.split("-");
        setMonth(Number(m));
    }, [usDate]);

    const yearShort = usDate.slice(2, 4);

    const emptyDomestic = () =>
        DOMESTIC_ITEMS.map(name => ({ name, qty: 1, v20: 0, v40: 0 }));

    const emptyUS = () =>
        US_ITEMS.map(name => ({ name, qty: 1, v20: 0, v40: 0 }));

    const [domesticMap, setDomesticMap] = useState({
        SAVANNAH: emptyDomestic(),
        MOBILE: emptyDomestic(),
        LA: emptyDomestic()
    });

    const [usCostMap, setUsCostMap] = useState({
        SAVANNAH: emptyUS(),
        MOBILE: emptyUS(),
        LA: emptyUS()
    });
    const domestic = domesticMap[route];
    const usCosts = usCostMap[route];

    const [ocean, setOcean] = useState({ qty: 1, v20: 2900, v40: 3500 });

    /* ============================
       계산
    ============================ */
    const sumSection = rows =>
        rows.reduce(
            (acc, r) => {
                acc.v20 += r.qty * Number(r.v20 || 0);
                acc.v40 += r.qty * Number(r.v40 || 0);
                return acc;
            },
            { v20: 0, v40: 0 }
        );

    const domesticSum = useMemo(() => sumSection(domestic), [domestic]);

    const oceanSum = useMemo(
        () => ({
            v20: ocean.qty * ocean.v20 * exchangeRate,
            v40: ocean.qty * ocean.v40 * exchangeRate
        }),
        [ocean, exchangeRate]
    );

    const usSum = useMemo(() => sumSection(usCosts), [usCosts]);

    const total20 = domesticSum.v20 + oceanSum.v20 + usSum.v20;
    const total40 = domesticSum.v40 + oceanSum.v40 + usSum.v40;

    const renderValue = (value, onChange) =>
        editMode ? (
            <TextField size="small" value={value} onChange={onChange} />
        ) : (
            value.toLocaleString()
        );



    const subtotalCell = { bgcolor: "#fff3cd" };
    const groupCellStyle = {
        borderBottom: "2px solid #c5c5c5",
        borderRight: "3px solid #c5c5c5",
        verticalAlign: "middle",
        backgroundColor: "#fff",
        pointerEvents: "none"   // 🔥 핵심
    };

    return (
        <Box sx={{ p: 3, pt: 2 }}>
            {/* 제목 */}
            <Typography fontWeight="bold" mb={0.5}>
                <Box component="span" sx={{ fontSize: 20 }}>
                    '{yearShort}년도{" "}
                </Box>
                <Box component="span" sx={{ fontSize: 20 }}>
                    {month}월 신화USA 수출 해상운임비용
                </Box>
            </Typography>

            {/* 북미 기준 날짜 + 버튼 */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 1,
                    mb: 1
                }}
            >
                <TextField
                    label="북미 기준 날짜"
                    size="small"
                    value={usDate}
                    onChange={e => editMode && setUsDate(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
                    sx={{ width: 220 }}
                />

                <Button variant="outlined" onClick={() => setEditMode(p => !p)}>
                    {editMode ? "수정모드 종료" : "수정모드 활성화"}
                </Button>

                <Button variant="contained" disabled={!editMode}>
                    저장
                </Button>
            </Box>

            {/* 조건 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2, ml: 1 }}>
                <Select
                    value={route}
                    onChange={e => setRoute(e.target.value)}
                    sx={{ fontWeight: "bold" }}
                >
                    {Object.entries(ROUTE_LABEL).map(([k, v]) => (
                        <MenuItem key={k} value={k} sx={{ fontWeight: "bold" }}>
                            {v}
                        </MenuItem>
                    ))}
                </Select>

                <Typography fontWeight="bold" fontSize={16}>
                    {month}월
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography fontWeight="bold" fontSize={16}>
                        환율
                    </Typography>

                    {editMode ? (
                        <TextField
                            size="small"
                            value={exchangeRate}
                            onChange={e => setExchangeRate(Number(e.target.value))}
                            sx={{ width: 110 }}
                        />
                    ) : (
                        <Typography fontWeight="bold" fontSize={16}>
                            {exchangeRate.toLocaleString()}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* ================= 테이블 ================= */}
            <Paper sx={{ p: 2 }}>
                {/* 🔥 이 한 줄만 추가됨 */}
                <Table size="small" key={route}>
                    <TableHead sx={{ bgcolor: "#e6f3ff", borderBottom: "1px solid #c5c5c5" }}>
                        <TableRow >
                            {["구분", "내역", "수량\n(CBM&M/T)", "20'FT", "40'HQ"].map(h => (
                                <TableCell key={h} align="center" sx={{ fontWeight: "bold", fontSize: "14px", borderBottom: "3px solid  #c5c5c5" }}>
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody
                        sx={{
                            "& td": {
                                fontWeight: "bold",
                                padding: "5px 6px",   // ← 핵심
                                lineHeight: 1.248
                            }
                        }}
                    >

                        {/* 국내비용 */}
                        {domestic.map((r, i) => (
                            <TableRow key={r.name}>
                                {i === 0 && (
                                    <TableCell
                                        rowSpan={domestic.length + 1}
                                        align="center"
                                        sx={groupCellStyle}
                                    >
                                        국내비용
                                    </TableCell>
                                )}
                                <TableCell align="center" >{r.name}</TableCell>
                                <TableCell align="center">
                                    {editMode ? (
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={r.qty}
                                            onChange={e => {
                                                setDomesticMap(prev => ({
                                                    ...prev,
                                                    [route]: prev[route].map((row, idx) =>
                                                        idx === i ? { ...row, qty: Number(e.target.value) } : row
                                                    )
                                                }));
                                            }}
                                            sx={{ width: 70 }}
                                        />
                                    ) : (
                                        r.qty
                                    )}
                                </TableCell>

                                <TableCell align="center">
                                    {renderValue(r.v20, e => {
                                        setDomesticMap(prev => ({
                                            ...prev,
                                            [route]: prev[route].map((row, idx) =>
                                                idx === i ? { ...row, v20: e.target.value } : row
                                            )
                                        }));

                                    })}
                                </TableCell>
                                <TableCell align="center">
                                    {renderValue(r.v40, e => {
                                        setDomesticMap(prev => ({
                                            ...prev,
                                            [route]: prev[route].map((row, idx) =>
                                                idx === i ? { ...row, v40: e.target.value } : row
                                            )
                                        }));

                                    })}
                                </TableCell>
                            </TableRow>
                        ))}

                        <TableRow>
                            <TableCell
                                align="center"
                                sx={{
                                    ...subtotalCell,
                                    borderBottom: "2px solid #c5c5c5"
                                }}
                            >

                                소 계
                            </TableCell>
                            <TableCell sx={{
                                ...subtotalCell,
                                borderBottom: "2px solid #c5c5c5"
                            }} />
                            <TableCell align="center" sx={{
                                ...subtotalCell,
                                borderBottom: "2px solid #c5c5c5"
                            }}>
                                {domesticSum.v20.toLocaleString()}
                            </TableCell>
                            <TableCell align="center" sx={{
                                ...subtotalCell,
                                borderBottom: "2px solid #c5c5c5"
                            }}>
                                {domesticSum.v40.toLocaleString()}
                            </TableCell>
                        </TableRow>

                        {/* 해상운임 */}
                        <TableRow>
                            <TableCell rowSpan={2} align="center" sx={groupCellStyle}>
                                해상운임
                            </TableCell>
                            <TableCell align="center">
                                BUSAN → MOBILE
                            </TableCell>

                            <TableCell align="center">
                                {editMode ? (
                                    <TextField
                                        size="small"
                                        type="number"
                                        value={ocean.qty}
                                        onChange={e =>
                                            setOcean({ ...ocean, qty: Number(e.target.value) })
                                        }
                                        sx={{ width: 70 }}
                                    />
                                ) : (
                                    ocean.qty
                                )}
                            </TableCell>

                            <TableCell align="center">
                                {renderValue(ocean.v20, e =>
                                    setOcean({ ...ocean, v20: e.target.value })
                                )}
                            </TableCell>
                            <TableCell align="center">
                                {renderValue(ocean.v40, e =>
                                    setOcean({ ...ocean, v40: e.target.value })
                                )}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell align="center" sx={{
                                ...subtotalCell,
                                borderBottom: "2px solid #c5c5c5"
                            }}>
                                소 계
                            </TableCell>
                            <TableCell sx={{
                                ...subtotalCell,
                                borderBottom: "2px solid #c5c5c5"
                            }} />
                            <TableCell align="center" sx={{
                                ...subtotalCell,
                                borderBottom: "2px solid #c5c5c5"
                            }}>
                                {oceanSum.v20.toLocaleString()}
                            </TableCell>
                            <TableCell align="center" sx={{
                                ...subtotalCell,
                                borderBottom: "2px solid #c5c5c5"
                            }}>
                                {oceanSum.v40.toLocaleString()}
                            </TableCell>
                        </TableRow>

                        {/* 미국비용 */}
                        {usCosts.map((r, i) => (
                            <TableRow key={r.name}>
                                {i === 0 && (
                                    <TableCell
                                        rowSpan={usCosts.length + 1}
                                        align="center"
                                        sx={groupCellStyle}
                                    >
                                        미국비용
                                    </TableCell>
                                )}
                                <TableCell align="center">{r.name}</TableCell>
                                <TableCell align="center">
                                    {editMode ? (
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={r.qty}
                                            onChange={e => {
                                                setUsCostMap(prev => ({
                                                    ...prev,
                                                    [route]: prev[route].map((row, idx) =>
                                                        idx === i ? { ...row, qty: Number(e.target.value) } : row
                                                    )
                                                }));
                                            }}
                                            sx={{ width: 70 }}
                                        />
                                    ) : (
                                        r.qty
                                    )}
                                </TableCell>

                                <TableCell align="center">
                                    {renderValue(r.v20, e => {
                                        setUsCostMap(prev => ({
                                            ...prev,
                                            [route]: prev[route].map((row, idx) =>
                                                idx === i ? { ...row, v20: e.target.value } : row
                                            )
                                        }));
                                    })}

                                </TableCell>
                                <TableCell align="center">
                                    {renderValue(r.v40, e => {
                                        setUsCostMap(prev => ({
                                            ...prev,
                                            [route]: prev[route].map((row, idx) =>
                                                idx === i ? { ...row, v40: e.target.value } : row
                                            )
                                        }));
                                    })}

                                </TableCell>
                            </TableRow>
                        ))}

                        <TableRow>
                            <TableCell align="center" sx={{
                                ...subtotalCell,
                                borderBottom: "2px solid #c5c5c5"
                            }}>
                                소 계
                            </TableCell>
                            <TableCell sx={{
                                ...subtotalCell,
                                borderBottom: "2px solid #c5c5c5"
                            }} />
                            <TableCell align="center" sx={{
                                ...subtotalCell,
                                borderBottom: "2px solid #c5c5c5"
                            }}>
                                {usSum.v20.toLocaleString()}
                            </TableCell>
                            <TableCell align="center" sx={{
                                ...subtotalCell,
                                borderBottom: "2px solid #c5c5c5"
                            }}>
                                {usSum.v40.toLocaleString()}
                            </TableCell>
                        </TableRow>

                        {/* 합계 */}
                        <TableRow sx={{ bgcolor: "#d1e7dd" }}>
                            <TableCell />
                            <TableCell align="center" sx={{ borderBottom: "2px solid #c5c5c5" }}>합 계</TableCell>
                            <TableCell />
                            <TableCell align="center" sx={{ borderBottom: "2px solid #c5c5c5" }}>
                                {total20.toLocaleString()}
                            </TableCell>
                            <TableCell align="center" sx={{ borderBottom: "2px solid #c5c5c5" }}>
                                {total40.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
}
