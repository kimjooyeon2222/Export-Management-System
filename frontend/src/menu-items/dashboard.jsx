// assets
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';      
import InventoryIcon from '@mui/icons-material/Inventory';     

// icons
const icons = {
  DashboardIcon,
  CategoryIcon,
  InventoryIcon
};


// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard = {
  id: 'group-dashboard',
  title: 'Menu',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title:"수출통합관리 시스템",
      type: 'item',
      url: '/dashboard/default',
      icon: icons.DashboardIcon,
      breadcrumbs: false

      
    },
    {
      id: 'item-management',
      title: '품목관리',
      type: 'item',
      url: '/item',
      icon: icons.CategoryIcon,  
      breadcrumbs: false
    },
    {
      id: 'stock-audit',
      title: '재고실사',
      type: 'item',
      url: '/stock-audit',
      icon: icons.InventoryIcon,
      breadcrumbs: false
    }
  ]
};

export default dashboard;
