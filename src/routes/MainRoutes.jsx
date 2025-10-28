import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';

// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - color
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));

// render - Invoice Page, Packing List (추가)
const InvoicePage = Loadable(lazy(() => import('pages/invoice/InvoicePage')));
const PackingList = Loadable(lazy(() => import('pages/invoice/PackingList'))); // ✅ 추가

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <DashboardLayout />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'typography',
      element: <Typography />
    },
    {
      path: 'color',
      element: <Color />
    },
    {
      path: 'shadow',
      element: <Shadow />
    },
    {
      path: 'sample-page',
      element: <SamplePage />
    },
    {
      path: 'invoice', 
      element: <InvoicePage />
    },
    {
      path: 'packing-list/:inv', 
      element: <PackingList />
    }
  ]
};

export default MainRoutes;
