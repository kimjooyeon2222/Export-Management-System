import React, { useRef, useState } from "react";
import { Box, IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export default function HorizontalScroll({ children }) {
  const scrollRef = useRef(null);
  const [hover, setHover] = useState(false);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  // 🔥 버튼 스타일 공통화 (클릭해도 동일한 회색 유지)
  const btnStyle = {
    background: hover ? "rgba(0,0,0,0.25)" : "transparent",
    color: "white",
    opacity: hover ? 1 : 0,
    transition: "opacity 0.25s ease, background 0.25s ease",
    zIndex: 10,
    "&:active": {
      background: "rgba(0,0,0,0.25)" // 클릭해도 동일한 회색 유지
    },
    "&:hover": {
      background: "rgba(0,0,0,0.25)" // hover 유지
    }
  };

  return (
    <Box
      sx={{ position: "relative" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* ◀ Left Button */}
      <IconButton
        onClick={scrollLeft}
        sx={{
          position: "absolute",
          top: "50%",
          left: 5,
          transform: "translateY(-50%)",
          ...btnStyle
        }}
      >
        <ArrowBackIosNewIcon />
      </IconButton>

      {/* ▶ Right Button */}
      <IconButton
        onClick={scrollRight}
        sx={{
          position: "absolute",
          top: "50%",
          right: 5,
          transform: "translateY(-50%)",
          ...btnStyle
        }}
      >
        <ArrowForwardIosIcon />
      </IconButton>

      {/* Scroll Area */}
      <Box
        ref={scrollRef}
        sx={{
          overflowX: "auto",
          whiteSpace: "nowrap",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          p: 1
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
