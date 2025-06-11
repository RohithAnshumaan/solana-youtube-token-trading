"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, Copy } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

interface depositInterface {
  message: string,
  address: string,
  balance: number,
  signature: string,
}

interface depositResponse {
  balance: number,
  walletAddress: string
}

interface transactionHistory {
  amount: number,
  signature: string,
  balanceAfter: number,
  timestamp: Date
  _id: string
}

export default function DepositPage() {
  const [depositAmount, setDepositAmount] = useState("")
  const [depositInfo, setDepositInfo] = useState<depositInterface | null>(null);
  const [balance, setBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [history, setHistory] = useState<transactionHistory[]>([]);
  //   const { toast } = useToast()
  
  useEffect (()=>{
    const getBalance = async () => {
      const response = await axios.get<depositResponse>("http://localhost:8080/api/wallet/getbalance", {withCredentials: true});
      setBalance(response.data.balance);
      setWalletAddress(response.data.walletAddress);
    }
    getBalance();
  })
  
  useEffect (()=> {
    const getTransactions = async () => {
      const response = await axios.get("http://localhost:8080/api/wallet/history", {withCredentials: true})
      setHistory(response.data.history);
    }
    getTransactions();
  })

  const confirmDeposit = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8080/api/wallet/deposit",
        { amount: depositAmount }, // Body
        { withCredentials: true }  // Config
      );
      setDepositInfo(response.data);
    } catch (error: any) {
      console.error("Deposit error:", error.response?.data || error.message);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast("Copied to clipboard", {
      description: "Wallet address has been copied to your clipboard.",
    })
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-background opacity-20"></div>

      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold gradient-text mb-8">Deposit Funds</h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Wallet Information */}
            <Card className="backdrop-blur-glass border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Wallet className="h-6 w-6 mr-2 text-cyan-400" />
                  Wallet Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-white mb-2">{balance} SOL</div>
                  <div className="text-gray-400">Current Balance</div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Your Wallet Address</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={walletAddress}
                      readOnly
                      className="bg-gray-800 border-gray-700 text-white font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(depositInfo?.address as string)}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deposit Form */}
            <Card className="backdrop-blur-glass border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">Deposit SOL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Deposit Amount (SOL)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 text-lg"
                  />
                  <div className="text-sm text-gray-400">
                    ≈ ₹{(Number.parseFloat(depositAmount || "0") * 14130).toFixed(2)} INR
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <h3 className="text-white font-semibold">Deposit Instructions</h3>
                  <ol className="text-sm text-gray-400 space-y-2">
                    <li>1. Copy your wallet address above</li>
                    <li>2. Send SOL from your external wallet</li>
                    <li>3. Wait for network confirmation</li>
                    <li>4. Your balance will update automatically</li>
                  </ol>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <div className="text-yellow-400 text-sm">
                    <strong>Important:</strong> Only send SOL to this address. Sending other tokens may result in
                    permanent loss.
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3"
                  disabled={!depositAmount}
                  onClick={confirmDeposit}
                >
                  Confirm Deposit
                </Button>

                <div className="text-center">
                  <Button variant="ghost" className="text-gray-400 hover:text-white">
                    View Transaction History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Deposits */}
          <Card className="backdrop-blur-glass border-gray-800/50 mt-8">
            <CardHeader>
              <CardTitle className="text-white">Recent Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((deposit) => (
                  <div key={deposit._id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-white font-semibold">+{deposit.amount} SOL</div>
                      <div className="text-gray-400 text-sm"> {new Date(deposit.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-gray-400 text-sm font-mono">{deposit.signature}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
