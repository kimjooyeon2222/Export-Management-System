
import React, { useRef, useState, forwardRef } from "react";
import { Box, IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const HorizontalScroll = forwardRef(
  ({ children, onScroll, showButtons = true }, externalRef) => {
    const scrollRef = useRef(null);
    const [hover, setHover] = useState(false);

    // 내부 ref + 외부 ref 연결
    const setRefs = (el) => {
      scrollRef.current = el;
      if (externalRef) externalRef.current = el;
    };

    const scrollLeft = () => {
      scrollRef.current?.scrollBy({ left: -150, behavior: "smooth" });
    };

    const scrollRight = () => {
      scrollRef.current?.scrollBy({ left: 150, behavior: "smooth" });
    };

    const btnStyle = {
      background: hover ? "rgba(0,0,0,0.25)" : "transparent",
      color: "white",
      opacity: hover ? 1 : 0,
      transition: "opacity 0.25s ease, background 0.25s ease",
      zIndex: 10,
      "&:active": { background: "rgba(0,0,0,0.25)" },
      "&:hover": { background: "rgba(0,0,0,0.25)" }
    };

    return (
      <Box
        sx={{
          position: "relative",
          cursor: showButtons ? "pointer" : "default"
        }}
        // 🔥 showButtons=false 이면 hover 이벤트 자체 제거
        onMouseEnter={showButtons ? () => setHover(true) : undefined}
        onMouseLeave={showButtons ? () => setHover(false) : undefined}
      >
        {/* ◀ ▶ 버튼은 showButtons=true 일 때만 */}
        {showButtons && (
          <>
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
          </>
        )}

        {/* 실제 스크롤 영역 */}
        <Box
          ref={setRefs}
          onScroll={onScroll}
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
);

export default HorizontalScroll;
