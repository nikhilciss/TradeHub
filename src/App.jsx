import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
  useLocation,
} from "react-router-dom";
import { DemoProvider, useDemo } from "./context/DemoContext";
import { Shell, Empty } from "./components/UI";
import {
  QuickOrder,
  Orders,
  OrderDetail,
  Invoices,
  Templates,
  Support,
} from "./pages/StorePages";
import {
  AdminDashboard,
  Customers,
  Users,
  Settings,
  Sales,
} from "./pages/AdminPages";
import { StorefrontShell } from "./components/storefront/Storefront";
import {
  ShopHome,
  ShopCatalog,
  ShopProduct,
  ShopCart,
} from "./pages/storefront/ShoppingPages";
import { Account, BulkOrder } from "./pages/storefront/AccountPages";
import { LoginPage } from "./pages/storefront/LoginPage";
import {
  CategoriesAdmin,
  ProductManagement,
} from "./pages/admin/CatalogManagement";
import { OdooConsole } from "./pages/admin/OdooConsole";
function Guard({ roles, admin = false }) {
  const { user, t } = useDemo(),
    location = useLocation();
  if (!user)
    return (
      <Navigate
        to={
          admin
            ? "/admin/login"
            : "/login?next=" +
              encodeURIComponent(location.pathname + location.search)
        }
        replace
      />
    );
  if (roles && !roles.includes(user.role))
    return (
      <>
        <Empty>{t("This workspace belongs to another demo role")}</Empty>
        <Link to="/store">{t("Continue shopping")}</Link>
      </>
    );
  return <Outlet />;
}
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage key="buyer-login" />} />
      <Route
        path="/admin/login"
        element={<LoginPage key="admin-login" admin />}
      />
      <Route element={<StorefrontShell />}>
        <Route path="/" element={<Navigate to="/store" replace />} />
        <Route path="/store" element={<ShopHome />} />
        <Route path="/store/catalog" element={<ShopCatalog />} />
        <Route path="/store/products/:id" element={<ShopProduct />} />
        <Route element={<Guard />}>
          <Route path="/store/cart" element={<ShopCart />} />
          <Route
            path="/store/checkout"
            element={<ShopCart key="checkout" checkout />}
          />
          <Route path="/store/quick-order" element={<BulkOrder />} />
          <Route path="/store/ai-preview" element={<QuickOrder ai />} />
          <Route path="/store/orders" element={<Orders />} />
          <Route path="/store/orders/:id" element={<OrderDetail />} />
          <Route path="/store/invoices" element={<Invoices />} />
          <Route path="/store/templates" element={<Templates />} />
          <Route path="/store/favorites" element={<ShopCatalog favorites />} />
          <Route path="/store/support" element={<Support />} />
          <Route path="/store/account" element={<Account />} />
          <Route path="/store/account/company" element={<Account />} />
          <Route path="/store/account/addresses" element={<Account />} />
          <Route element={<Guard roles={["customer_admin"]} />}>
            <Route path="/store/account/users" element={<Account />} />
            <Route path="/store/approvals" element={<Orders approvals />} />
          </Route>
        </Route>
      </Route>
      <Route element={<Guard admin roles={["admin", "inside_sales"]} />}>
        <Route element={<Shell />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/categories" element={<CategoriesAdmin />} />
          <Route path="/admin/orders" element={<Orders admin />} />
          <Route path="/admin/orders/:id" element={<OrderDetail admin />} />
          <Route path="/admin/customers" element={<Customers />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/odoo" element={<OdooConsole />} />
        </Route>
      </Route>
      <Route element={<Guard roles={["field_sales"]} />}>
        <Route element={<Shell />}>
          <Route path="/sales" element={<Sales />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <>
            <Empty>Page not found</Empty>
            <Link to="/store">Continue shopping</Link>
          </>
        }
      />
    </Routes>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <DemoProvider>
        <ScrollToTop />
        <AppRoutes />
      </DemoProvider>
    </BrowserRouter>
  );
}
