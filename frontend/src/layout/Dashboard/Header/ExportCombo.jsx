import { Button, Menu, MenuItem, Box } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ExportCombo() {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);

  // 전체 메뉴
  const menuList = [
    { label: "INVOICE TRK", path: "/invoice" },
    { label: "단조품", path: "/forging" },
    { label: "오일", path: "/oil-schedule" },
    { label: "AXLE서브품", path: "/axle-sub" },
    { label: "EV서브품", path: "/ev-sub" },
    { label: "브라켓", path: "/bracket" },
    { label: "공구대차(종료)", path: "/cart" },
    { label: "수출품 사진", path: "/photo" }
  ];

  // 🔥 드롭다운에 INVOICE TRK 제외
  const dropdownMenus = menuList.filter(m => m.label !== "INVOICE TRK");

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
    
        gap: 2,
        ml: 2
      }}
    >
      {/* 🔥 INVOICE TRK 버튼 (클릭 가능) */}
      <Button
  onClick={() => navigate("/invoice")}
  sx={{
    fontSize: 16,
    fontWeight: "bold",
    color: "#2a2c2c",
    textTransform: "none",
    minWidth: 140,        // ⬅️ 버튼 너비 늘림 (필요시 160으로 늘리면 됨)
    whiteSpace: "nowrap", // ⬅️ 줄바꿈 방지
    "&:hover": { background: "#e3f2fd" }
  }}
>
  INVOICE TRK
</Button>


      {/* 🔥 GAP */}
      <Box sx={{ width: 8 }}></Box>

      {/* 🔥 수출통합관리 드롭다운 버튼 */}
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        endIcon={<ArrowDropDownIcon />}
        sx={{
          fontWeight: "bold",
          bgcolor: "#fff",
          width: 160,
          justifyContent: "space-between",
          color: "#2a2c2c",
          fontSize: 15,
          border: "1px solid #ddd",
          textTransform: "none",
          "&:hover": { background: "#fafafa" }
        }}
      >
        수출통합관리
      </Button>

      {/* 드롭다운 메뉴 */}
      <Menu
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
      >
        {dropdownMenus.map(item => (
          <MenuItem
            key={item.path}
            onClick={() => {
              navigate(item.path);
              setAnchor(null);
            }}
            sx={{
              fontWeight: "bold",
              fontSize: "0.95rem",
              py: 1.2,
              color: "#555"
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
