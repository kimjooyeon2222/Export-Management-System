// pages/shipment/ShipmentGraph.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
    Box,
    Typography,
    Select,
    MenuItem,
    Paper,
    Button
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "api/apiFetch";

/* ============================
   상수 정의
============================ */
const ROUTES = [
    { key: "SAVANNAH", label: "BUSAN → SAVANNAH" },
    { key: "MOBILE", label: "BUSAN → MOBILE" },
    { key: "LA", label: "BUSAN → LA" }
];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ShipmentGraph() {
    const API_BASE = import.meta.env.VITE_API_URL;

    const ITEM_HEIGHT = 48;

    const YEARS = Array.from(
        { length: 2099 - 2020 + 1 },
        (_, i) => 2020 + i
    );

    const yearListRef = useRef(null);

    const YEAR_MENU_PROPS = {
        PaperProps: {
            sx: {
                maxHeight: ITEM_HEIGHT * 5,   // ✅ 5년 단위
                overflowY: "auto"
            }
        },
        MenuListProps: {
            ref: yearListRef
        }
    };

    /* ============================
       기간 상태
    ============================ */
    const [startYear, setStartYear] = useState(null);
    const [startMonth, setStartMonth] = useState(null);
    const [endYear, setEndYear] = useState(null);
    const [endMonth, setEndMonth] = useState(null);

    /* ============================
       노선별 데이터
    ============================ */
    const [dataMap, setDataMap] = useState({
        SAVANNAH: [],
        MOBILE: [],
        LA: []
    });

    /* ============================
       X축 월 범위
    ============================ */
    const monthRange = useMemo(() => {
        if (
            startYear == null ||
            startMonth == null ||
            endYear == null ||
            endMonth == null
        ) {
            return [];
        }

        const result = [];
        let y = startYear;
        let m = startMonth;

        while (y < endYear || (y === endYear && m <= endMonth)) {
            result.push({
                year: y,
                month: m,
                label: `${String(y).slice(2)}.${m}`
            });
            m++;
            if (m === 13) {
                m = 1;
                y++;
            }
        }
        return result;
    }, [startYear, startMonth, endYear, endMonth]);


    useEffect(() => {
        const loadDefaultPeriod = async () => {
            const res = await apiFetch(`${API_BASE}/api/shipment/setting`);
            const data = await res.json();

            if (data.default_year && data.default_month) {
                setStartYear(data.default_year);
                setStartMonth(data.default_month);

                // ✅ 기본은 "기준연월 ~ 기준연월 + 11개월"
                let ey = data.default_year;
                let em = data.default_month + 11;

                if (em > 12) {
                    ey += Math.floor((em - 1) / 12);
                    em = ((em - 1) % 12) + 1;
                }

                setEndYear(ey);
                setEndMonth(em);
            }
        };

        loadDefaultPeriod();
    }, []);

    /* ============================
       데이터 로드 (노선별)
    ============================ */
    useEffect(() => {
        // 🔒 기간 값 다 준비되기 전엔 절대 호출하지 않음
        if (
            startYear == null ||
            startMonth == null ||
            endYear == null ||
            endMonth == null
        ) {
            return;
        }

        const load = async () => {
            const results = {};

            try {
                for (const r of ROUTES) {
                    const res = await apiFetch(
                        `${API_BASE}/api/shipment/graph?route=${r.key}&start_year=${startYear}&start_month=${startMonth}&end_year=${endYear}&end_month=${endMonth}`
                    );
                    results[r.key] = await res.json();
                }

                setDataMap(results);
            } catch (e) {
                console.warn("shipment graph load skipped:", e);
            }
        };

        load();
    }, [startYear, startMonth, endYear, endMonth]);


    /* ============================
       노선별 차트 데이터 (USD 변환)
    ============================ */
    const buildChartData = (routeKey) =>
        monthRange.map(m => {
            const row = dataMap[routeKey]?.find(
                r => r.year === m.year && r.month === m.month
            );

            return {
                label: m.label,
                v20: row?.total_20_usd || 0,
                v40: row?.total_40_usd || 0
            };
        });


    /* ============================
       차트 렌더
    ============================ */
    const renderRouteChart = (routeKey, title) => {
        const chartData = buildChartData(routeKey);

        return (
            <Paper sx={{ p: 2 }}>
                <Typography fontWeight="bold" mb={1}>
                    {title} (USD)
                </Typography>

                <LineChart
                    height={260}
                    series={[
                        {
                            data: chartData.map(d => d.v20),
                            label: "20'FT",
                            color: "#1f77b4"
                        },
                        {
                            data: chartData.map(d => d.v40),
                            label: "40'HQ",
                            color: "#ff7f0e"
                        }
                    ]}
                    xAxis={[
                        {
                            scaleType: "point",
                            data: chartData.map(d => d.label),
                            label: "MONTH",
                            labelStyle: {
                                fontWeight: "bold"
                            }
                        }
                    ]}
                    yAxis={[
                        {
                            label: "USD",
                            labelStyle: {
                                fontWeight: "bold"
                            },
                            tickLabelStyle: {
                                fontWeight: "bold"
                            }
                        }
                    ]}
                    sx={{
                        "& text": {
                            fontWeight: "bold"
                        }
                    }}
                />
            </Paper>
        );
    };

    return (
        <Box sx={{ p: 0 }}>
            {/* ================= 상단 ================= */}


            <Typography
                fontWeight="bold"
                fontSize={18}
                sx={{ ml: 2, mb: 2 }}
            >
                노선별 운임비 추이 (USD / 20'FT · 40'HQ)
            </Typography>

            {/* ================= 기간 선택 ================= */}
            <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                <Select value={startYear} onChange={e => setStartYear(e.target.value)} sx={{ fontWeight: "bold" }} MenuProps={YEAR_MENU_PROPS}>
                    {YEARS.map(y => <MenuItem key={y} value={y}>{y}년</MenuItem>)}
                </Select>

                <Select value={startMonth} onChange={e => setStartMonth(e.target.value)} sx={{ fontWeight: "bold" }}>
                    {MONTHS.map(m => <MenuItem key={m} value={m}>{m}월</MenuItem>)}
                </Select>

                <Typography fontWeight="bold" sx={{ mt: 1, fontSize: "18px" }}>~</Typography>

                <Select value={endYear} onChange={e => setEndYear(e.target.value)} sx={{ fontWeight: "bold" }} MenuProps={YEAR_MENU_PROPS}>
                    {YEARS.map(y => <MenuItem key={y} value={y}>{y}년</MenuItem>)}
                </Select>

                <Select value={endMonth} onChange={e => setEndMonth(e.target.value)} sx={{ fontWeight: "bold" }}>
                    {MONTHS.map(m => <MenuItem key={m} value={m}>{m}월</MenuItem>)}
                </Select>
            </Box>

            {/* ================= 그래프 ================= */}

            {/* 1행 */}
            <Box sx={{ mb: 3 }}>
                {renderRouteChart("SAVANNAH", "BUSAN → SAVANNAH")}
            </Box>

            {/* 2행 */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {renderRouteChart("MOBILE", "BUSAN → MOBILE")}
                {renderRouteChart("LA", "BUSAN → LA")}
            </Box>
        </Box>
    );
}
