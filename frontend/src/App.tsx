// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import HomePage from "@/pages/homepage" // adjust this path based on your tsconfig baseUrl or relative import
import Deposit from "./pages/deposit"
import MarketPage from "./pages/market"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/market" element={<MarketPage />} />
      </Routes>
    </Router>
  )
}

export default App
