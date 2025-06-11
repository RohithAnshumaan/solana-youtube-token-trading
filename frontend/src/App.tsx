// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast"; // Import the Toaster
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
        {/* Place the Toaster here to show notifications globally */}
        <Toaster position="top-right" reverseOrder={false} />

        {/* Routes */}
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
