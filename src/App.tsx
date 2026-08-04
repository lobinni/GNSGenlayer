import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { WalletProvider } from "@/lib/wallet/WalletProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import RegisterPage from "@/pages/RegisterPage";
import NameProfilePage from "@/pages/NameProfilePage";
import DashboardPage from "@/pages/DashboardPage";
import ManagePage from "@/pages/ManagePage";
import SubnamesPage from "@/pages/SubnamesPage";
import ResolvePage from "@/pages/ResolvePage";
import DisputesPage from "@/pages/DisputesPage";
import AboutPage from "@/pages/AboutPage";
import OpsGnsPage from "@/pages/OpsGnsPage";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <WalletProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/register/:name" element={<RegisterPage />} />
              <Route path="/name/:name" element={<NameProfilePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/manage/:name" element={<ManagePage />} />
              <Route path="/subnames/:name" element={<SubnamesPage />} />
              <Route path="/resolve" element={<ResolvePage />} />
              <Route path="/disputes" element={<DisputesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/ops-gns" element={<OpsGnsPage />} />
            </Routes>
          </Layout>
        </WalletProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
