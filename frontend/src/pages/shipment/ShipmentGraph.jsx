// pages/shipment/ShipmentGraph.jsx
import React, { useEffect, useMemo, useState } from "react";
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

const YEARS = Array.from({ length: 10 }, (_, i) => 2020 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ShipmentGraph() {
    const navigate = useNavigate();
    const API_BASE = import.meta.env.VITE_API_URL;

    /* ============================
       기간 상태
    ============================ */
    const [startYear, setStartYear] = useState(2026);
    const [startMonth, setStartMonth] = useState(1);
    const [endYear, setEndYear] = useState(2026);
    const [endMonth, setEndMonth] = useState(12);

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

    /* ============================
       데이터 로드 (노선별)
    ============================ */
    useEffect(() => {
        const load = async () => {
            const results = {};

            for (const r of ROUTES) {
                const res = await apiFetch(
                    `${API_BASE}/api/shipment/graph?route=${r.key}&start_year=${startYear}&start_month=${startMonth}&end_year=${endYear}&end_month=${endMonth}`
                );
                results[r.key] = await res.json();
            }

            setDataMap(results);
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
        <Box sx={{ p: 3 }}>
            {/* ================= 상단 ================= */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Button
                    onClick={() => navigate(-1)}
                    sx={{ fontWeight: "bold" }}
                >
                    ← 운임비용 페이지로
                </Button>

                <Typography
                    fontWeight="bold"
                    fontSize={20}
                    sx={{ ml: 2 }}
                >
                    노선별 운임비 추이 (USD / 20'FT · 40'HQ)
                </Typography>
            </Box>

            {/* ================= 기간 선택 ================= */}
            <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
                <Select value={startYear} onChange={e => setStartYear(e.target.value)} sx={{ fontWeight: "bold" }}>
                    {YEARS.map(y => <MenuItem key={y} value={y}>{y}년</MenuItem>)}
                </Select>

                <Select value={startMonth} onChange={e => setStartMonth(e.target.value)} sx={{ fontWeight: "bold" }}>
                    {MONTHS.map(m => <MenuItem key={m} value={m}>{m}월</MenuItem>)}
                </Select>

                <Typography fontWeight="bold" sx={{ mt: 1 }}>~</Typography>

                <Select value={endYear} onChange={e => setEndYear(e.target.value)} sx={{ fontWeight: "bold" }}>
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
