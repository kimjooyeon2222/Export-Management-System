import { Button, Menu, MenuItem, Box } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ExportCombo() {
  const navigate = useNavigate();
  const location = useLocation();   // 👈 현재 URL 감지
  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);

  const [selectedLabel, setSelectedLabel] = useState("수출품목");

  // 전체 메뉴
  const menuList = [
    { label: "INVOICE TRK", path: "/invoice" },
    { label: "단조품", path: "/forging" },
    { label: "오일", path: "/oil-schedule" },
    { label: "AXLE서브품", path: "/axle-sub" },
    { label: "EV서브품", path: "/ev-sub" },
    { label: "브라켓", path: "/bracket" },
    { label: "수출품 사진", path: "/photo" }
  ];

  const dropdownMenus = menuList.filter(m => m.label !== "INVOICE TRK");


  // ✔ 페이지 이동 시 자동 텍스트 업데이트
  useEffect(() => {
    const found = dropdownMenus.find(m => m.path === location.pathname);
    if (found) {
      setSelectedLabel(found.label);      // 현재 페이지가 dropdown 메뉴면 그 이름 표시
    } else {
      setSelectedLabel("수출품목");       // 그 외 페이지는 default
    }
  }, [location.pathname]);
  

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, ml: 2 }}>
      
      {/* INVOICE TRK 버튼 */}
      <Button
        onClick={() => navigate("/invoice")}
        sx={{
          fontSize: 15,
          fontWeight: 700,
          color: "#333",
          textTransform: "none",
          minWidth: 140,
          whiteSpace: "nowrap",
          border: "1px solid #cfcfcf",
          borderRadius: "6px",
          backgroundColor: "#fafafa",
          "&:hover": {
            backgroundColor: "#e9f3ff",
            borderColor: "#90caf9"
          }
        }}
      >
        INVOICE TRK
      </Button>

      <Box sx={{ width: 8 }}></Box>

      {/* ✔ 수출품목 드롭다운 버튼 */}
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        endIcon={<ArrowDropDownIcon />}
        sx={{
          fontWeight: 700,
          bgcolor: "#fafafa",
          width: 150,
          justifyContent: "center",
          color: "#333",
          fontSize: 15,
          border: "1px solid #cfcfcf",
          borderRadius: "6px",
          textTransform: "none",
          "& .MuiButton-endIcon": {
            position: "absolute",
            right: 8,
            color: "#555"
          },
          "&:hover": {
            backgroundColor: "#e9f3ff",
            borderColor: "#90caf9"
          }
        }}
      >
        {selectedLabel}
      </Button>


      {/* ▼ 드롭다운 메뉴 */}
      <Menu
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        PaperProps={{ style: { minWidth: 150 } }}
      >
        {dropdownMenus.map(item => (
          <MenuItem
            key={item.path}
            onClick={() => {
              navigate(item.path);
              setAnchor(null);
            }}
            sx={{
              fontWeight: 600,
              fontSize: "16px",
              display: "flex",
              justifyContent: "center",
              py: 1.3,
              color: "#444",
              "&:hover": { backgroundColor: "#f2f6ff" }
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
