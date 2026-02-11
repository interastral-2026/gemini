import 'dotenv/config';
import express from 'express';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 8080;

// 1. BULLETPROOF CORS MIDDLEWARE
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Accept,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

// Credentials (using variables for easier updates)
const API_KEY_NAME = process.env.COINBASE_API_KEY_NAME || "organizations/d90bac52-0e8a-4999-b156-7491091ffb5e/apiKeys/79d55457-7e62-45ad-8656-31e1d96e0571";
const PRIVATE_KEY_RAW = process.env.COINBASE_PRIVATE_KEY || "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIADE7F++QawcWU5iZfqmo8iupxBkqfJsFV0KsTaGpRpLoAoGCCqGSM49\nAwEHoUQDQgAEhSKrrlzJxIh6hgr5fT0cZf3NO91/a6kRPkWRNG6kQlLW8FIzJ53Y\nDgbh5U2Zj3zlxHWivwVyZGMWMf8xEdxYXw==\n-----END EC PRIVATE KEY-----\n";

const cleanKey = (key) => key ? key.replace(/\\n/g, '\n').trim() : "";
const PRIVATE_KEY = cleanKey(PRIVATE_KEY_RAW);

let isEmergencyStopped = false;

try {
  Coinbase.configure({ apiKeyName: API_KEY_NAME, privateKey: PRIVATE_KEY });
  console.log("✅ Coinbase SDK Configured");
} catch (err) {
  console.error("❌ Coinbase Auth Error:", err.message);
}

// Gemini AI for Signals
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

app.get('/api/status', (req, res) => res.json({ isEmergencyStopped }));

app.post('/api/emergency-stop', (req, res) => {
  isEmergencyStopped = req.body.stop;
  res.json({ success: true, isEmergencyStopped });
});

app.get('/api/portfolio', async (req, res) => {
  try {
    // Note: Wallet.listWallets() fetches CDP Wallets (Server-side)
    // If you have funds on Coinbase.com, you need to use the Retail API.
    const walletsResponse = await Wallet.listWallets();
    const realWallets = walletsResponse.data || [];
    
    let portfolio = [];
    
    for (const w of realWallets) {
      const balance = await w.getBalance(w.assetId);
      const amount = parseFloat(balance || 0);
      const symbol = w.assetId;

      let asset = {
        symbol: symbol,
        name: symbol,
        balance: amount,
        currentPrice: 1,
        entryPrice: 1,
        roi: 0,
        type: symbol === 'EUR' || symbol === 'USD' ? 'FIAT' : 'CRYPTO'
      };

      if (asset.type === 'CRYPTO') {
        try {
          const ticker = await Coinbase.getTicker(`${symbol}-EUR`);
          asset.currentPrice = parseFloat(ticker.price);
          asset.entryPrice = asset.currentPrice; // Fallback
        } catch (e) { console.warn(`Price fail for ${symbol}`); }
      }
      portfolio.push(asset);
    }

    // Only fallback if absolutely nothing is found
    if (portfolio.length === 0) {
      portfolio = [
        { symbol: 'EUR', name: 'Euro', balance: 0.00, currentPrice: 1, entryPrice: 1, roi: 0, type: 'FIAT' },
        { symbol: 'BTC', name: 'Bitcoin', balance: 0.00, entryPrice: 0, currentPrice: 0, roi: 0, type: 'CRYPTO' }
      ];
    }
    res.json(portfolio);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/trades', async (req, res) => {
  try {
    const wallets = await Wallet.listWallets();
    let allTrades = [];
    
    for (const w of (wallets.data || [])) {
      // In CDP SDK, we look for Transfers
      const transfers = await w.listTransfers();
      const mapped = (transfers.data || []).map(t => ({
        id: t.id,
        timestamp: new Date().getTime(), // SDK might not provide timestamp in simple list
        symbol: w.assetId,
        side: t.direction === 'send' ? 'SELL' : 'BUY',
        amount: parseFloat(t.amount),
        price: 0, 
        status: 'COMPLETED'
      }));
      allTrades = [...allTrades, ...mapped];
    }
    res.json(allTrades.slice(0, 20));
  } catch (e) {
    res.json([]);
  }
});

app.get('/api/signals', async (req, res) => {
  try {
    // Generate AI Signals on the fly
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate 3 high-probability crypto trading signals for BTC, ETH, and SOL in JSON format. Include: symbol, action (BUY/SELL), confidence (0-100), reasoning.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              action: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING }
            }
          }
        }
      }
    });
    res.json(JSON.parse(response.text || '[]'));
  } catch (e) {
    res.json([]);
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on ${PORT}`));
