import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';


// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));
// render - Item / Stock Audit
const ItemPage = Loadable(lazy(() => import('pages/item/ItemPage')));
const StockAuditPage = Loadable(lazy(() => import('pages/stock-audit/StockAuditPage')));
const StockAuditDetailPage = Loadable(
  lazy(() => import('pages/stock-audit/StockAuditDetailPage'))
);

// render - color
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));

// render - Invoice Page, Packing List (추가)
const InvoicePage = Loadable(lazy(() => import('pages/invoice/InvoicePage')));
const PackingList = Loadable(lazy(() => import('pages/invoice/PackingList'))); 
const ForgingPage = Loadable(lazy(() => import('pages/forging/ForgingPage')));
const OilShipmentSchedule = Loadable(
  lazy(() => import('pages/OilShipment/OilShipmentSchedule'))
);
const BracketPage = Loadable(lazy(() => import('pages/bracket/BracketPage')));

const POManagementPage = Loadable(lazy(() => import('pages/po/po_management')));

import AxleSubPage from 'pages/AxleSub/AxleSubPage';
import EvSubPage from 'pages/EvSub/EvSubPage';
import RequireAuth from 'sections/auth/RequireAuth';



// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
    element: (
       <RequireAuth>

      <DashboardLayout />
        </RequireAuth>

  ),
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
      path: 'item',
      element: <ItemPage />
    },
    {
      path: 'stock-audit',
      children: [
        {
         path: '',
         element: <StockAuditPage />
        },
        {
          path: ':auditDate',
          element: <StockAuditDetailPage />
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
    },
    {
       path: 'forging', element: <ForgingPage /> 
    },
    {
       path: 'oil-schedule',
       element: <OilShipmentSchedule />
    },
    {
       path: 'axle-sub',
       element: <AxleSubPage />
    },
    {
       path: 'ev-sub',
       element: <EvSubPage />
    },
    {
      path: 'bracket',
      element: <BracketPage />
    },
    {
       path: 'po-management',
      element: <POManagementPage />
    },






  ]
};

export default MainRoutes;
