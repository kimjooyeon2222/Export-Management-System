import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import { Navigate } from 'react-router-dom';


// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));
// render - Item / Stock Audit
const ItemPage = Loadable(lazy(() => import('pages/item/ItemPage')));
const StockAuditPage = Loadable(lazy(() => import('pages/stock-audit/StockAuditPage')));
const StockAuditDetailPage = Loadable(
  lazy(() => import('pages/stock-audit/StockAuditDetailPage'))
);
const ShipmentPage = Loadable(
  lazy(() => import('pages/shipment/ShipmentPage'))
);
const ShipmentGraph = Loadable(
  lazy(() => import('pages/shipment/ShipmentGraph'))
);
const UserManagementPage = Loadable(
  lazy(() => import('pages/Administration/administration'))
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
      index: true,
      element: <Navigate to="/dashboard/default" replace />
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
          path: ':auditId',
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
      path: 'forging',
      element: <ForgingPage />
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
    {
      path: 'shipment',
      children: [
        {
          path: '',
          element: <ShipmentPage />
        },
        {
          path: 'graph',
          element: <ShipmentGraph />
        }
      ]
    },
    {
      path: 'users',
      element: <UserManagementPage />
    }


  ]
};

export default MainRoutes;
