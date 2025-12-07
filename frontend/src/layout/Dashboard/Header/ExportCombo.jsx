import { Button, Menu, MenuItem } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useState } from "react";
import { useNavigate } from "react-router-dom";



export default function ExportCombo() {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);

  const open = Boolean(anchor);

  const menuList = [
  { label: "INVOICE TRK", path: "/invoice" },
  { label: "단조품", path: "/forging" },
  { label: "오일", path: "/oil-schedule" },     // 🔥 수정됨
  { label: "AXLE서브품", path: "/axle-sub" },   // 🔥 수정됨
  { label: "EV서브품", path: "/ev-sub" },
  { label: "브라켓", path: "/bracket" },
  { label: "공구대차(종료)", path: "/cart" },
  { label: "수출품 사진", path: "/photo" }
];

  return (
    <>
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        endIcon={<ArrowDropDownIcon />}
        sx={{ ml: 2, fontWeight: "bold", bgcolor: "#fff", width:150,    justifyContent: "space-between", color: "#2a2c2cf1", fontSize:15,
 }}
      >
        수출통합관리
      </Button>

      <Menu open={open} anchorEl={anchor} onClose={() => setAnchor(null)}>
        {menuList.map((item) => (
          <MenuItem
            key={item.path}
            onClick={() => {
              navigate(item.path);
              setAnchor(null);
            }}
              sx={{
    fontWeight: 'bold',   // 🔥 볼드체
    fontSize: '0.95rem',  // 🔥 폰트 크기 조절
    py: 1.2,  
    color:"#777",            // (선택) 위아래 여백 넓힘
  }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
