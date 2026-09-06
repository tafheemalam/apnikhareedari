import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import VerifyEmailBanner from './VerifyEmailBanner';
import WhatsAppButton from './WhatsAppButton';

export default function StorefrontLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <VerifyEmailBanner />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
