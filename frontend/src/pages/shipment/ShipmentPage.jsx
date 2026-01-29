import React, { useState, useMemo, useEffect, useRef } from "react";
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
import { apiFetch } from "api/apiFetch";

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

    const yearListRef = useRef(null);        // 조회연도

    const ITEM_HEIGHT = 48;

    const YEAR_MENU_PROPS = {
        PaperProps: {
            sx: {
                maxHeight: ITEM_HEIGHT * 5,
                overflowY: "auto"
            }
        },
        MenuListProps: {
            ref: yearListRef
        }
    };


    const YEARS = Array.from(
        { length: 2099 - 2020 + 1 },
        (_, i) => 2020 + i
    );

    const [defaultYear, setDefaultYear] = useState(null);
    const [defaultMonth, setDefaultMonth] = useState(null);
    const [year, setYear] = useState(null);
    const [month, setMonth] = useState(null);
    const yearShort = year ? String(year).slice(2, 4) : "";

    const API_BASE = import.meta.env.VITE_API_URL;

    const [route, setRoute] = useState("SAVANNAH");
    const saveDefaultYM = async () => {
        await apiFetch(`${API_BASE}/api/shipment/setting`, {
            method: "POST",
            body: JSON.stringify({
                default_year: defaultYear,
                default_month: defaultMonth
            })
        });

        alert("기준 연월이 저장되었습니다.");
        setEditMode(false);

    };

    const EMPTY_DOMESTIC = useMemo(
        () => DOMESTIC_ITEMS.map(name => ({ name, qty: 1, v20: 0, v40: 0 })),
        []
    );

    const EMPTY_US = useMemo(
        () => US_ITEMS.map(name => ({ name, qty: 1, v20: 0, v40: 0 })),
        []
    );


    const [domesticMap, setDomesticMap] = useState({
        SAVANNAH: EMPTY_DOMESTIC.map(r => ({ ...r })),
        MOBILE: EMPTY_DOMESTIC.map(r => ({ ...r })),
        LA: EMPTY_DOMESTIC.map(r => ({ ...r }))
    });

    const [usCostMap, setUsCostMap] = useState({
        SAVANNAH: EMPTY_US.map(r => ({ ...r })),
        MOBILE: EMPTY_US.map(r => ({ ...r })),
        LA: EMPTY_US.map(r => ({ ...r }))
    });

    const domestic = domesticMap[route];
    const usCosts = usCostMap[route];

    const [ocean, setOcean] = useState({ qty: 1, v20: 2900, v40: 3500 });
    const [saving, setSaving] = useState(false);


    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        console.log("🔥 handleSave clicked");

        const num = v => (v === "" || v == null ? 0 : Number(v));

        try {
            const payload = {
                route,
                year,
                month,
                exchange_rate: exchangeRate,

                domestic: domesticMap[route].map(r => ({
                    name: r.name,
                    qty: r.qty,
                    v20: num(r.v20),
                    v40: num(r.v40)

                })),

                ocean: {
                    qty: ocean.qty,
                    v20: Number(ocean.v20),
                    v40: Number(ocean.v40)
                },

                us_costs: usCostMap[route].map(r => ({
                    name: r.name,
                    qty: r.qty,
                    v20: num(r.v20),
                    v40: num(r.v40)

                }))
            };
            console.log("🔥 shipment payload", payload);

            await apiFetch(`${API_BASE}/api/shipment/save`, {
                method: "POST",
                body: JSON.stringify(payload)
            });





            alert("저장되었습니다.");
            setEditMode(false);


        } catch (err) {
            console.error(err);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            // 🔥🔥🔥 이게 핵심
            setSaving(false);
        }
    };

    const roundUp10k = (value) =>
        Math.ceil(value / 100000) * 100000;

    const [editMode, setEditMode] = useState(false);

    const [exchangeRate, setExchangeRate] = useState(1470);
    useEffect(() => {
        const loadDefault = async () => {
            try {
                const res = await apiFetch(`${API_BASE}/api/shipment/setting`);
                const data = await res.json();

                if (data.default_year && data.default_month) {
                    // 🔥 기준연월 콤보용
                    setDefaultYear(data.default_year);
                    setDefaultMonth(data.default_month);

                    // 🔥 실제 조회용
                    setYear(data.default_year);
                    setMonth(data.default_month);
                } else {
                    const now = new Date();
                    const y = now.getFullYear();
                    const m = now.getMonth() + 1;

                    setDefaultYear(y);
                    setDefaultMonth(m);
                    setYear(y);
                    setMonth(m);
                }

            } catch (e) {
                console.error("shipment setting load error", e);
            }
        };

        loadDefault();
    }, []);

    useEffect(() => {
        if (!year || !month) return;   // ⭐ 핵심

        let cancelled = false;

        const load = async () => {
            try {
                const response = await apiFetch(
                    `${API_BASE}/api/shipment/load?route=${route}&year=${year}&month=${month}`
                );

                const res = await response.json();   // ⭐⭐⭐ 핵심 수정

                if (cancelled) return;

                if (!res || !res.header) {
                    console.warn("📛 shipment header not found");

                    setDomesticMap(prev => ({
                        ...prev,
                        [route]: EMPTY_DOMESTIC.map(r => ({ ...r }))
                    }));

                    setUsCostMap(prev => ({
                        ...prev,
                        [route]: EMPTY_US.map(r => ({ ...r }))
                    }));

                    setOcean({ qty: 1, v20: 0, v40: 0 });

                    if (!editMode) {
                        setExchangeRate(1470);
                    }

                    return;
                }

                if (!editMode) {
                    setExchangeRate(res.header.exchange_rate);
                }

                setDomesticMap(prev => ({
                    ...prev,
                    [route]: res.domestic.map(r => ({
                        name: r.item_name,
                        qty: Number(r.qty),
                        v20: Number(r.cost_20),
                        v40: Number(r.cost_40)
                    }))
                }));

                if (res.ocean) {
                    setOcean({
                        qty: Number(res.ocean.qty),
                        v20: Number(res.ocean.cost_20_usd),
                        v40: Number(res.ocean.cost_40_usd)
                    });
                }

                setUsCostMap(prev => ({
                    ...prev,
                    [route]: res.us_costs.map(r => ({
                        name: r.item_name,
                        qty: Number(r.qty),
                        v20: Number(r.cost_20_usd),
                        v40: Number(r.cost_40_usd)
                    }))
                }));

            } catch (e) {
                console.error("shipment load error", e);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [route, year, month]);





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
            v20: ocean.qty * ocean.v20,
            v40: ocean.qty * ocean.v40
        }),
        [ocean]
    );


    const usSum = useMemo(() => sumSection(usCosts), [usCosts]);

    const total20 = roundUp10k(
        domesticSum.v20 +
        (oceanSum.v20 + usSum.v20) * exchangeRate
    );

    const total40 = roundUp10k(
        domesticSum.v40 +
        (oceanSum.v40 + usSum.v40) * exchangeRate
    );


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
                <Box component="span" sx={{ fontSize: 19 }}>
                    {yearShort}년{" "}
                </Box>
                <Box component="span" sx={{ fontSize: 19 }}>
                    {month}월 신화 USA 수출 운임비용
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

                {/* 기준 연도 */}
                {editMode && (
                    <Select
                        size="small"
                        value={defaultYear || ""}
                        disabled={!editMode}
                        onChange={e => setDefaultYear(Number(e.target.value))}
                        sx={{ width: 110, fontWeight: "bold" }}
                        onOpen={() => {
                            requestAnimationFrame(() => {
                                const index = YEARS.indexOf(year);
                                if (yearListRef.current && index >= 0) {
                                    yearListRef.current.scrollTop = index * ITEM_HEIGHT;
                                }
                            });
                        }}
                        MenuProps={YEAR_MENU_PROPS}
                    >
                        {YEARS.map(y => (
                            <MenuItem key={y} value={y}>
                                {y}년
                            </MenuItem>
                        ))}
                    </Select>


                )}

                {/* 기준 월 */}
                {editMode && (
                    <Select
                        size="small"
                        value={defaultMonth || ""}
                        disabled={!editMode}
                        onChange={e => setDefaultMonth(Number(e.target.value))}
                        sx={{ width: 90, fontWeight: "bold" }}
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <MenuItem key={m} value={m}>{m}월</MenuItem>
                        ))}
                    </Select>)}
                {editMode && (
                    <Button
                        variant="contained"
                        onClick={saveDefaultYM}
                        sx={{ fontWeight: "bold" }}
                    >
                        기준연월 저장
                    </Button>
                )}

                {editMode && (
                    <Button
                        variant="contained"
                        disabled={!editMode}
                        onClick={handleSave}
                        sx={{ fontWeight: "bold" }}
                    >
                        저장
                    </Button>
                )}
                {!editMode ? (
                    /* 🔵 수정모드 진입 */
                    <Button
                        variant="outlined"
                        onClick={() => setEditMode(true)}
                        sx={{ fontWeight: "bold" }}
                    >
                        수정모드 활성화
                    </Button>
                ) : (
                    /* 🔴 수정모드 종료 */
                    <Button
                        variant="outlined"

                        onClick={() => setEditMode(false)}
                        sx={{ fontWeight: "bold" }}
                    >
                        수정모드 종료
                    </Button>
                )}

            </Box>


            {/* 조건 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2, ml: 1 }}>
                <Select
                    value={route}
                    disabled={editMode}
                    onChange={e => setRoute(e.target.value)}
                    sx={{
                        fontWeight: "bold",
                        bgcolor: editMode ? "#f0f0f0" : "inherit",
                        cursor: editMode ? "not-allowed" : "pointer"
                    }}
                >
                    {Object.entries(ROUTE_LABEL).map(([k, v]) => (
                        <MenuItem key={k} value={k} sx={{ fontWeight: "bold" }}>
                            {v}
                        </MenuItem>
                    ))}
                </Select>

                {/* 연도 */}
                <Select
                    size="small"
                    value={year || ""}
                    disabled={editMode}
                    onChange={e => setYear(Number(e.target.value))}
                    onOpen={() => {
                        requestAnimationFrame(() => {
                            const index = YEARS.indexOf(defaultYear);
                            if (yearListRef.current && index >= 0) {
                                yearListRef.current.scrollTop = index * ITEM_HEIGHT;
                            }
                        });
                    }}

                    sx={{
                        width: 110,
                        fontWeight: "bold",
                        bgcolor: editMode ? "#f0f0f0" : "inherit",
                        cursor: editMode ? "not-allowed" : "pointer"
                    }}
                    MenuProps={YEAR_MENU_PROPS}
                >
                    {YEARS.map(y => (
                        <MenuItem key={y} value={y}>
                            {y}년
                        </MenuItem>
                    ))}
                </Select>


                <Typography fontWeight="bold" fontSize={16}>
                    <Select
                        size="small"
                        value={month || ""}
                        disabled={editMode}   // 🔥 중요: 수정모드일 때 막음
                        onChange={e => setMonth(Number(e.target.value))}
                        sx={{
                            width: 90,
                            fontWeight: "bold",
                            bgcolor: editMode ? "#f0f0f0" : "inherit",
                            cursor: editMode ? "not-allowed" : "pointer"
                        }}
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <MenuItem key={m} value={m}>
                                {m}월
                            </MenuItem>
                        ))}
                    </Select>

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
                            {exchangeRate.toLocaleString()} 원
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* ================= 테이블 ================= */}
            <Paper sx={{ p: 2 }}>
                {/* 🔥 이 한 줄만 추가됨 */}
                <Table size="small">
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
                                {ROUTE_LABEL[route]}
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
                                {editMode ? (
                                    renderValue(ocean.v20, e =>
                                        setOcean({ ...ocean, v20: e.target.value })
                                    )
                                ) : (
                                    <>USD {Number(ocean.v20).toLocaleString()}</>
                                )}
                            </TableCell>
                            <TableCell align="center">
                                {editMode ? (
                                    renderValue(ocean.v40, e =>
                                        setOcean({ ...ocean, v40: e.target.value })
                                    )
                                ) : (
                                    <>USD {Number(ocean.v40).toLocaleString()}</>
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
                                USD {oceanSum.v20.toLocaleString()}
                            </TableCell>
                            <TableCell align="center" sx={{
                                ...subtotalCell,
                                borderBottom: "2px solid #c5c5c5"
                            }}>
                                USD {oceanSum.v40.toLocaleString()}
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
                                    {editMode ? (
                                        renderValue(r.v20, e => {
                                            setUsCostMap(prev => ({
                                                ...prev,
                                                [route]: prev[route].map((row, idx) =>
                                                    idx === i ? { ...row, v20: e.target.value } : row
                                                )
                                            }));
                                        })
                                    ) : (
                                        <>USD {Number(r.v20).toLocaleString()}</>
                                    )}
                                </TableCell>

                                <TableCell align="center">
                                    {editMode ? (
                                        renderValue(r.v40, e => {
                                            setUsCostMap(prev => ({
                                                ...prev,
                                                [route]: prev[route].map((row, idx) =>
                                                    idx === i ? { ...row, v40: e.target.value } : row
                                                )
                                            }));
                                        })
                                    ) : (
                                        <>USD {Number(r.v40).toLocaleString()}</>
                                    )}
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
                                USD {usSum.v20.toLocaleString()}
                            </TableCell>
                            <TableCell align="center" sx={{
                                ...subtotalCell,
                                borderBottom: "2px solid #c5c5c5"
                            }}>
                                USD {usSum.v40.toLocaleString()}
                            </TableCell>
                        </TableRow>

                        {/* 합계 */}
                        <TableRow sx={{ bgcolor: "#d1e7dd" }}>
                            <TableCell />
                            <TableCell align="center" sx={{ borderBottom: "2px solid #c5c5c5" }}>합 계</TableCell>
                            <TableCell />
                            <TableCell align="center" sx={{ borderBottom: "2px solid #c5c5c5" }}>
                                {total20.toLocaleString()} 원
                            </TableCell>
                            <TableCell align="center" sx={{ borderBottom: "2px solid #c5c5c5" }}>
                                {total40.toLocaleString()} 원
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
}
