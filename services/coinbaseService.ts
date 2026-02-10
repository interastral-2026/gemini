
import { Asset, Trade, BotConfig } from "../types";

// آدرس مستقیم بک‌بند شما در Railway
const BACKEND_URL = "https://eco-production-d6cd.up.railway.app"; 

export const fetchPortfolio = async (config: BotConfig): Promise<Asset[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/portfolio`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Portfolio fetch failed: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("Portfolio connection error:", err);
    throw err;
  }
};

export const fetchBotStatus = async (): Promise<{ isEmergencyStopped: boolean }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/status`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error("Status fetch failed");
    return await response.json();
  } catch (err) {
    console.error("Status fetch error:", err);
    return { isEmergencyStopped: false };
  }
};

export const toggleEmergencyStop = async (stop: boolean): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/emergency-stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stop })
    });
    if (!response.ok) throw new Error("Emergency toggle failed");
    const result = await response.json();
    return !!result.isEmergencyStopped;
  } catch (err) {
    console.error("Emergency toggle error:", err);
    return !stop; 
  }
};

export const fetchSignals = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/signals`);
    return response.ok ? await response.json() : [];
  } catch (err) {
    return [];
  }
};

export const fetchTrades = async (): Promise<Trade[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/trades`);
    return response.ok ? await response.json() : [];
  } catch (err) {
    return [];
  }
};

export const executeOrder = async (config: BotConfig, symbol: string, side: 'BUY' | 'SELL', amount: number): Promise<Trade> => {
  const response = await fetch(`${BACKEND_URL}/api/trade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, side, amount })
  });
  if (!response.ok) throw new Error("Trade execution failed");
  return await response.json();
};
