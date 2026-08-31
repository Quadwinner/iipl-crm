
import React, { createContext, useContext, useState, useEffect } from "react";

export type CurrencyType = "USD" | "AUD" | "CAD" | "INR" | "EUR" | "GBP" | "AED";

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyType>("USD");
  const [symbol, setSymbol] = useState("$");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("site_currency") : null;
    const validCurrencies: CurrencyType[] = ["USD", "AUD", "CAD", "INR", "EUR", "GBP", "AED"];
    if (saved && validCurrencies.includes(saved as CurrencyType)) {
      setCurrencyState(saved as CurrencyType);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("site_currency", currency);
    switch (currency) {
      case "INR":
        setSymbol("₹");
        break;
      case "AUD":
        setSymbol("A$");
        break;
      case "CAD":
        setSymbol("C$");
        break;
      case "EUR":
        setSymbol("€");
        break;
      case "GBP":
        setSymbol("£");
        break;
      case "AED":
        setSymbol("AED");
        break;
      default:
        setSymbol("$");
        break;
    }
  }, [currency]);

  const setCurrency = (cur: CurrencyType) => {
    setCurrencyState(cur);
    window.dispatchEvent(new CustomEvent("currencychange", { detail: cur }));
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
