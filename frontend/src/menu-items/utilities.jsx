// assets
import {
  AppstoreAddOutlined,
  AntDesignOutlined,
  BarcodeOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  LoadingOutlined,
  TeamOutlined
} from '@ant-design/icons';

// icons
const icons = {
  FontSizeOutlined,
  BgColorsOutlined,
  BarcodeOutlined,
  AntDesignOutlined,
  LoadingOutlined,
  AppstoreAddOutlined,
  TeamOutlined
};

// ==============================|| MENU ITEMS - UTILITIES ||============================== //

const utilities = {
  id: 'utilities',
  title: 'Administration',
  type: 'group',
  children: [
    {
      id: 'utilities',
      title: '사용자 권한 관리',
      type: 'item',
      url: '/users',
      icon: icons.TeamOutlined,
      breadcrumbs: false
    }
    /*  
    ,
    {
      id: 'util-color',
      title: 'Color',
      type: 'item',
      url: '/color',
      icon: icons.BgColorsOutlined
    },
    {
      id: 'util-shadow',
      title: 'Shadow',
      type: 'item',
      url: '/shadow',
      icon: icons.BarcodeOutlined
    } */
  ]
};

export default utilities;
