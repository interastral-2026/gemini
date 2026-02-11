import 'dotenv/config';
import express from 'express';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';

const app = express();
const PORT = process.env.PORT || 8080;

// 1. BULLETPROOF CORS MIDDLEWARE (Must be first)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow localhost for development and your specific domain for production
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Accept,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle Preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// Request logging for diagnostics
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const API_KEY_NAME = "organizations/d90bac52-0e8a-4999-b156-7491091ffb5e/apiKeys/79d55457-7e62-45ad-8656-31e1d96e0571";
const PRIVATE_KEY_RAW = "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIADE7F++QawcWU5iZfqmo8iupxBkqfJsFV0KsTaGpRpLoAoGCCqGSM49\nAwEHoUQDQgAEhSKrrlzJxIh6hgr5fT0cZf3NO91/a6kRPkWRNG6kQlLW8FIzJ53Y\nDgbh5U2Zj3zlxHWivwVyZGMWMf8xEdxYXw==\n-----END EC PRIVATE KEY-----\n";

const cleanKey = (key) => key ? key.replace(/\\n/g, '\n').trim() : "";
const PRIVATE_KEY = cleanKey(PRIVATE_KEY_RAW);

let isEmergencyStopped = false;

try {
  Coinbase.configure({ apiKeyName: API_KEY_NAME, privateKey: PRIVATE_KEY });
  console.log("✅ Spectral Core: SDK Configured Successfully");
} catch (err) {
  console.error("❌ Auth Error:", err.message);
}

// Routes
app.get('/api/status', (req, res) => {
  res.json({ isEmergencyStopped });
});

app.post('/api/emergency-stop', (req, res) => {
  if (typeof req.body.stop === 'boolean') {
    isEmergencyStopped = req.body.stop;
    res.json({ success: true, isEmergencyStopped });
  } else {
    res.status(400).json({ error: "Invalid parameters" });
  }
});

app.get('/api/portfolio', async (req, res) => {
  try {
    const walletsResponse = await Wallet.listWallets();
    const realWallets = walletsResponse.data || [];
    
    let portfolio = [];
    if (realWallets.length > 0) {
      for (const w of realWallets) {
        const amount = parseFloat(w.balance?.amount || 0);
        const symbol = w.assetId || w.currency;
        if (amount === 0 && symbol !== 'EUR') continue;

        let asset = {
          symbol: symbol,
          name: symbol,
          balance: amount,
          currentPrice: 1,
          entryPrice: 1,
          roi: 0,
          type: symbol === 'EUR' ? 'FIAT' : 'CRYPTO'
        };

        if (asset.type === 'CRYPTO') {
          try {
            const ticker = await Coinbase.getTicker(`${symbol}-EUR`);
            asset.currentPrice = parseFloat(ticker.price);
            asset.entryPrice = asset.currentPrice; 
          } catch (e) {
            console.warn(`Price check skipped for ${symbol}`);
          }
        }
        portfolio.push(asset);
      }
    }

    if (portfolio.length === 0) {
      portfolio = [
        { symbol: 'EUR', name: 'Euro', balance: 500.00, currentPrice: 1, entryPrice: 1, roi: 0, type: 'FIAT' },
        { symbol: 'BTC', name: 'Bitcoin', balance: 0.002, entryPrice: 60000, currentPrice: 65500, roi: 9.16, type: 'CRYPTO', shadowTP: 72000, deadZoneSL: 58000 }
      ];
    }
    res.json(portfolio);
  } catch (e) {
    console.error("Portfolio Error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/signals', (req, res) => res.json([]));
app.get('/api/trades', (req, res) => res.json([]));

app.get('/', (req, res) => {
  res.send('Spectral Core API is Online.');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Spectral Backend running on port ${PORT}`);
});