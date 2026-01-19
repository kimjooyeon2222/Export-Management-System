import { Button, Menu, MenuItem, Box } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ExportCombo() {
  const navigate = useNavigate();
  const location = useLocation();   // 👈 현재 URL 감지
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
    { label: "수출품 사진", path: "/photo" }
  ];


  const [selectedLabel, setSelectedLabel] = useState("수출품목");
  const isOilPage = location.pathname === "/oil-schedule";
  const dropdownMenus = menuList.filter(m => m.label !== "INVOICE TRK");


  const isActive = (path) => location.pathname === path;
  const isDropdownActive = dropdownMenus.some(
    m => m.path === location.pathname
  );



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
          fontSize: 14,
          fontWeight: 700,
          minWidth: 140,
          borderRadius: "6px",
          textTransform: "none",

          /* ✅ ACTIVE 스타일 */
          backgroundColor: isActive("/invoice") ? "#e3f2fd" : "#fafafa",
          border: isActive("/invoice")
            ? "1.5px solid #1976d2"
            : "1px solid #cfcfcf",
          color: isActive("/invoice") ? "#1976d2" : "#333",

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
          fontWeight: 600,
        
          width: 130,
          justifyContent: "center",
         
          fontSize: 14,
          
          borderRadius: "6px",
          backgroundColor: isDropdownActive ? "#e3f2fd" : "#fafafa",
          border: isDropdownActive
            ? "1.5px solid #1976d2"
            : "1px solid #cfcfcf",
          color: isDropdownActive ? "#1976d2" : "#333",
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
      {/* 🔥 수출품목 버튼 오른쪽 신규 버튼 2개 추가 */}
      <Box sx={{ width: 8 }}></Box>

      <Button
        onClick={() => navigate("/po-management")}
        sx={{
          fontSize: 14,
          fontWeight: 700,
          minWidth: 130,
          textTransform: "none",
          borderRadius: "6px",

          backgroundColor: isActive("/po-management") ? "#e3f2fd" : "#fafafa",
          border: isActive("/po-management")
            ? "1.5px solid #1976d2"
            : "1px solid #cfcfcf",
          color: isActive("/po-management") ? "#1976d2" : "#333",

          "&:hover": {
            backgroundColor: "#e9f3ff",
            borderColor: "#90caf9"
          }
        }}
      >
        PO# 관리
      </Button>


      <Box sx={{ width: 8 }}></Box>

      <Button
        onClick={() => alert("운송 페이지는 준비중입니다.")}
        sx={{
          fontSize: 14,
          fontWeight: 700,
          color: "#333",
          textTransform: "none",
          minWidth: 130,
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
        운송
      </Button>

      {/* ▼ 드롭다운 메뉴 */}
      <Menu
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        PaperProps={{ style: { minWidth: 130 } }}
      >
        {dropdownMenus.map(item => (
          <MenuItem
            key={item.path}
            onClick={() => {
              if (item.label === "수출품 사진") {
                // 🔥 외부 Google Drive 폴더로 연결
                window.open(
                  "https://drive.google.com/drive/folders/1-dRvoG81-yMONR3NseliqnQGyQnjFSAD",
                  "_blank"
                );
                setAnchor(null);
                return;
              }

              navigate(item.path);
              setAnchor(null);
            }}
            sx={{
              fontWeight: 600,
              fontSize: "14px",
              display: "flex",
              justifyContent: "center",
              py: 1.0,
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
