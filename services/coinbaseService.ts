import { Asset, Trade, BotConfig } from "../types";

const API_BASE = "https://robot-production-9206.up.railway.app/api"; 

export const fetchPortfolio = async (config: BotConfig): Promise<Asset[]> => {
  try {
    const response = await fetch(`${API_BASE}/portfolio`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Portfolio HTTP Error ${response.status}:`, errorText);
      throw new Error(`Server returned ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error("Critical Portfolio Connection Error:", err);
    throw err;
  }
};

export const fetchBotStatus = async (): Promise<{ isEmergencyStopped: boolean }> => {
  try {
    const response = await fetch(`${API_BASE}/status`, { mode: 'cors' });
    if (!response.ok) throw new Error(`Status HTTP Error: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("fetchBotStatus connection failed:", err);
    return { isEmergencyStopped: false };
  }
};

export const toggleEmergencyStop = async (stop: boolean): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/emergency-stop`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stop })
    });
    if (!response.ok) throw new Error("Toggle stop failed");
    const result = await response.json();
    return result.isEmergencyStopped;
  } catch (err) {
    console.error("toggleEmergencyStop failed:", err);
    return !stop;
  }
};

export const fetchSignals = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE}/signals`, { mode: 'cors' });
    return response.ok ? await response.json() : [];
  } catch (err) { return []; }
};

export const fetchTrades = async (): Promise<Trade[]> => {
  try {
    const response = await fetch(`${API_BASE}/trades`, { mode: 'cors' });
    return response.ok ? await response.json() : [];
  } catch (err) { return []; }
};

export const executeOrder = async (config: BotConfig, symbol: string, side: 'BUY' | 'SELL', amount: number): Promise<Trade> => {
  try {
    const response = await fetch(`${API_BASE}/trade`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, side, amount })
    });
    if (!response.ok) throw new Error("Trade execution failed");
    return await response.json();
  } catch (err) {
    console.error("executeOrder failed:", err);
    throw err;
  }
};