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
import { AssistedOrder } from "./pages/storefront/AssistedOrder";
import { CompanySelection } from "./pages/storefront/CompanySelection";
import { RoleManagement } from "./pages/admin/RoleManagement";
import { AIConfiguration } from "./pages/admin/AIConfiguration";
import { routePermissions, staffLanding } from "./services/roleService";
function Guard({ roles, admin = false, companyRequired = false }) {
  const { user, identity, state, can, selectedCompany, t } = useDemo(),
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
  if (companyRequired && !selectedCompany)
    return (
      <Navigate
        to={
          "/companies?next=" +
          encodeURIComponent(location.pathname + location.search)
        }
        replace
      />
    );
  const permission = Object.entries(routePermissions)
    .sort((a, b) => b[0].length - a[0].length)
    .find(
      ([path]) =>
        location.pathname === path || location.pathname.startsWith(path + "/"),
    )?.[1];
  if (permission && !can(permission))
    return (
      <>
        <Empty>{t("You do not have permission to access this page.")}</Empty>
        <Link to={staffLanding(state, identity)}>
          {t("Return to workspace")}
        </Link>
      </>
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
function CompanyStoreShell() {
  const { selectedCompany } = useDemo();
  return <StorefrontShell key={selectedCompany?.id} />;
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
      <Route path="/" element={<LoginPage key="landing-login" />} />
      <Route element={<Guard />}>
        <Route path="/companies" element={<CompanySelection />} />
      </Route>
      <Route path="/login" element={<LoginPage key="buyer-login" />} />
      <Route
        path="/admin/login"
        element={<LoginPage key="admin-login" admin />}
      />
      <Route element={<Guard companyRequired />}>
        <Route element={<CompanyStoreShell />}>
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
            <Route path="/store/ai-preview" element={<AssistedOrder />} />
            <Route path="/store/orders" element={<Orders />} />
            <Route path="/store/orders/:id" element={<OrderDetail />} />
            <Route path="/store/invoices" element={<Invoices />} />
            <Route path="/store/templates" element={<Templates />} />
            <Route
              path="/store/favorites"
              element={<ShopCatalog favorites />}
            />
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
          <Route path="/admin/roles" element={<RoleManagement />} />
          <Route path="/admin/ai" element={<AIConfiguration />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/odoo" element={<OdooConsole />} />
        </Route>
      </Route>
      <Route element={<Guard companyRequired roles={["field_sales"]} />}>
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
