// assets
import IosShareIcon from '@mui/icons-material/IosShare';

// icons
const icons = {
  IosShareIcon
};


// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard = {
  id: 'group-dashboard',
  title: 'Menu',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: '수출통합관리 시스템',
      type: 'item',
      url: '/dashboard/default',
      icon: icons.IosShareIcon,
      breadcrumbs: false
    }
  ]
};

export default dashboard;
