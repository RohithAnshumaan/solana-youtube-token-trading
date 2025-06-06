"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WalletInfo {
    address: string;
    balance: number;
}

const Deposit: React.FC = () => {
    const [amount, setAmount] = useState<string>("");
    const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleDeposit = async () => {
        if (!amount) {
            alert("Please enter an amount.");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8080/api/wallet/deposit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ amount: parseFloat(amount) }),
            });

            const data = await response.json();
            if (response.ok) {
                setWalletInfo(data);
            } else {
                alert(data.message || "Deposit failed.");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-black/90 border border-gray-800 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4 text-white">Deposit INR</h1>
            <div className="flex flex-col space-y-4">
                <Input
                    type="number"
                    placeholder="Enter amount in INR"
                    value={amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                    className="text-black"
                />

                <Button
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
                    onClick={handleDeposit}
                    disabled={loading}
                >
                    {loading ? "Processing..." : "Deposit"}
                </Button>
            </div>
            {walletInfo && (
                <div className="mt-6 text-white">
                    <p>✅ Wallet Created!</p>
                    <p>
                        <strong>Address:</strong> {walletInfo.address}
                    </p>
                    <p>
                        <strong>Balance:</strong> {walletInfo.balance} SOL
                    </p>
                </div>
            )}
        </div>
    );
};

export default Deposit;
