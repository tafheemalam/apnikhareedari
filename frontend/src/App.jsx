import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SiteProvider } from './context/SiteContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/ProtectedRoute';

import StorefrontLayout from './components/layout/StorefrontLayout';
import AuthLayout from './components/layout/AuthLayout';
import AccountLayout from './components/layout/AccountLayout';
import AdminLayout from './components/layout/AdminLayout';

import Home from './pages/Home';
import ProductListing from './pages/ProductListing';
import ProductDetails from './pages/ProductDetails';
import Baskets from './pages/Baskets';
import BasketFill from './pages/BasketFill';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import PaymentInstructions from './pages/PaymentInstructions';
import VerifyEmail from './pages/VerifyEmail';
import ContactUs from './pages/ContactUs';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import ShippingInfo from './pages/ShippingInfo';
import NotFound from './pages/NotFound';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import MyOrders from './pages/account/MyOrders';
import OrderDetails from './pages/account/OrderDetails';
import Wishlist from './pages/account/Wishlist';
import Profile from './pages/account/Profile';
import Addresses from './pages/account/Addresses';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCategories from './pages/admin/AdminCategories';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminInventory from './pages/admin/AdminInventory';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetails from './pages/admin/AdminOrderDetails';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminBaskets from './pages/admin/AdminBaskets';
import AdminReviews from './pages/admin/AdminReviews';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminShipping from './pages/admin/AdminShipping';
import AdminBanners from './pages/admin/AdminBanners';
import AdminSettings from './pages/admin/AdminSettings';
import AdminUsers from './pages/admin/AdminUsers';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SiteProvider>
            <CartProvider>
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
            </CartProvider>
          </SiteProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
