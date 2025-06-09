import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Copy, QrCode } from "lucide-react";
import { toast } from "react-hot-toast";

export default function DepositPage() {
  const [depositAmount, setDepositAmount] = useState("");

  const walletAddress = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
  const currentBalance = 15.67;

  const copyToClipboard = (text: any) => {
    navigator.clipboard.writeText(text);
    toast("Wallet address has been copied to your clipboard.");
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-background opacity-20"></div>

      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold gradient-text mb-8">
            Deposit Funds
          </h1>

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
                  <div className="text-3xl font-bold text-white mb-2">
                    {currentBalance} SOL
                  </div>
                  <div className="text-gray-400">Current Balance</div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Your Wallet Address</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={walletAddress}
                      className="bg-gray-800 border-gray-700 text-white font-mono text-sm"
                      onChange={()=>{}}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(walletAddress)}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <QrCode className="h-32 w-32 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">
                    QR Code for wallet address
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
                  <Label className="text-gray-300">
                    Deposit Amount (SOL)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 text-lg"
                  />
                  <div className="text-sm text-gray-400">
                    ≈ $
                    {(
                      Number.parseFloat(depositAmount || "0") * 85.5
                    ).toFixed(2)}{" "}
                    USD
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <h3 className="text-white font-semibold">
                    Deposit Instructions
                  </h3>
                  <ol className="text-sm text-gray-400 space-y-2">
                    <li>1. Copy your wallet address above</li>
                    <li>2. Send SOL from your external wallet</li>
                    <li>3. Wait for network confirmation</li>
                    <li>4. Your balance will update automatically</li>
                  </ol>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <div className="text-yellow-400 text-sm">
                    <strong>Important:</strong> Only send SOL to this
                    address. Sending other tokens may result in permanent
                    loss.
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3"
                  disabled={!depositAmount}
                >
                  Confirm Deposit
                </Button>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
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
                {[
                  {
                    amount: 5.0,
                    date: "2024-01-15",
                    status: "Completed",
                    txHash: "abc123...",
                  },
                  {
                    amount: 2.5,
                    date: "2024-01-14",
                    status: "Completed",
                    txHash: "def456...",
                  },
                  {
                    amount: 10.0,
                    date: "2024-01-13",
                    status: "Pending",
                    txHash: "ghi789...",
                  },
                ].map((deposit, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-white font-semibold">
                        +{deposit.amount} SOL
                      </div>
                      <div className="text-gray-400 text-sm">
                        {deposit.date}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div
                        className={`text-sm px-2 py-1 rounded ${
                          deposit.status === "Completed"
                            ? "bg-green-900 text-green-400"
                            : "bg-yellow-900 text-yellow-400"
                        }`}
                      >
                        {deposit.status}
                      </div>
                      <div className="text-gray-400 text-sm font-mono">
                        {deposit.txHash}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
