import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Analytics from './components/Analytics';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SiteProvider } from './context/SiteContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

import StorefrontLayout from './components/layout/StorefrontLayout';
import AuthLayout from './components/layout/AuthLayout';
import AccountLayout from './components/layout/AccountLayout';
import AdminLayout from './components/layout/AdminLayout';

// Kept eager: these are the pages real shoppers and search-engine crawlers
// land on directly, so they ship in the main bundle for the fastest first paint.
import Home from './pages/Home';
import ProductListing from './pages/ProductListing';
import ProductDetails from './pages/ProductDetails';
import NotFound from './pages/NotFound';

// Everything else is lazy-loaded so its code doesn't bloat the bundle every
// storefront visitor downloads, since it's only reached after an explicit click.
const Baskets = lazy(() => import('./pages/Baskets'));
const BasketFill = lazy(() => import('./pages/BasketFill'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const PaymentInstructions = lazy(() => import('./pages/PaymentInstructions'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const ShippingInfo = lazy(() => import('./pages/ShippingInfo'));

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

const MyOrders = lazy(() => import('./pages/account/MyOrders'));
const OrderDetails = lazy(() => import('./pages/account/OrderDetails'));
const Wishlist = lazy(() => import('./pages/account/Wishlist'));
const Profile = lazy(() => import('./pages/account/Profile'));
const Addresses = lazy(() => import('./pages/account/Addresses'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetails = lazy(() => import('./pages/admin/AdminOrderDetails'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminBaskets = lazy(() => import('./pages/admin/AdminBaskets'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminQuestions = lazy(() => import('./pages/admin/AdminQuestions'));
const AdminShipping = lazy(() => import('./pages/admin/AdminShipping'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Analytics />
      <ToastProvider>
        <AuthProvider>
          <SiteProvider>
            <CartProvider>
              <Suspense fallback={<LoadingSpinner size="lg" className="py-24" />}>
              <Routes>
                <Route element={<StorefrontLayout />}>
                  <Route index element={<Home />} />
                  <Route path="shop" element={<ProductListing mode="shop" />} />
                  <Route path="categories/:categorySlug" element={<ProductListing mode="category" />} />
                  <Route path="search" element={<ProductListing mode="search" />} />
                  <Route path="products/:slug" element={<ProductDetails />} />
                  <Route path="baskets" element={<Baskets />} />
                  <Route path="baskets/:cartBasketId/fill" element={<BasketFill />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="order-confirmation/:orderNumber" element={<OrderConfirmation />} />
                  <Route path="payment-instructions/:orderNumber" element={<PaymentInstructions />} />
                  <Route path="verify-email/:id/:hash" element={<VerifyEmail />} />
                  <Route path="contact" element={<ContactUs />} />
                  <Route path="about" element={<AboutUs />} />
                  <Route path="privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="shipping-info" element={<ShippingInfo />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="account" element={<AccountLayout />}>
                      <Route index element={<MyOrders />} />
                      <Route path="orders" element={<MyOrders />} />
                      <Route path="orders/:orderNumber" element={<OrderDetails />} />
                      <Route path="wishlist" element={<Wishlist />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="addresses" element={<Addresses />} />
                    </Route>
                  </Route>
                </Route>

                <Route element={<GuestRoute />}>
                  <Route element={<AuthLayout />}>
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="reset-password" element={<ResetPassword />} />
                  </Route>
                </Route>

                <Route element={<AdminRoute />}>
                  <Route path="admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminProductForm />} />
                    <Route path="products/:id" element={<AdminProductForm />} />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="orders/:id" element={<AdminOrderDetails />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="baskets" element={<AdminBaskets />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="questions" element={<AdminQuestions />} />
                    <Route path="shipping" element={<AdminShipping />} />
                    <Route path="banners" element={<AdminBanners />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="users" element={<AdminUsers />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </CartProvider>
          </SiteProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
