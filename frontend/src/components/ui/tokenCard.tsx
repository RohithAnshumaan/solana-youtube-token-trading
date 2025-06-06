import React from "react";

interface TokenCardProps {
  children: React.ReactNode;
  className?: string;
}

const TokenCard: React.FC<TokenCardProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`rounded-lg shadow-md bg-gray-800 text-gray-100 ${className}`}
    >
      {children}
    </div>
  );
};

export const TokenCardContent: React.FC<TokenCardProps> = ({ children, className = "" }) => {
  return <div className={`p-4 ${className}`}>{children}</div>;
};

export default TokenCard;
