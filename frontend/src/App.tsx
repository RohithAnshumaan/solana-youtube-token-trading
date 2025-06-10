// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast"; // Import the Toaster

import Deposit from "./pages/deposit";
import MarketPage from "./pages/marketPage";
import ProfilePage from "./pages/profilePage";
import { SignUpPage } from "./pages/signUpPage";
import HomePage from "./pages/homePage";

function App() {
  return (
    <Router>
      <div>
        {/* Place the Toaster here to show notifications globally */}
        <Toaster position="top-right" reverseOrder={false} />

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
