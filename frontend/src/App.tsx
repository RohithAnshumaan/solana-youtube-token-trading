import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import MarketPage from "./pages/marketPage";
import ProfilePage from "./pages/profilePage";
import HomePage from "./pages/homePage";
import BuyTokensPage from "./pages/buyTokenPage";
import DepositPage from "./pages/deposit";
import CreateTokenPage from "./pages/createTokenPage";
import TokenPage from "./pages/tokenPage";

function App() {
  return (
    <Router>
      <div>
        <Toaster richColors position="top-center" />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/deposit" element={<DepositPage />} />
          <Route path="/buy-tokens" element={<BuyTokensPage />} />
          <Route path="/create-token" element={<CreateTokenPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/token/:id" element={<TokenPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
