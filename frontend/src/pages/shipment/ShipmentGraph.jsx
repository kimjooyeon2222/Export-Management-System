// src/pages/shipment/ShipmentGraph.jsx
import React from "react";
import { Box, Typography } from "@mui/material";

export default function ShipmentGraph() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography fontWeight="bold" fontSize={20}>
        운임비 추이 그래프
      </Typography>
    </Box>
  );
}
