
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';

const app = express();

// تنظیمات جامع CORS برای پذیرش درخواست از هر منبعی (لوکال یا وب)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

const API_KEY_NAME = "organizations/d90bac52-0e8a-4999-b156-7491091ffb5e/apiKeys/79d55457-7e62-45ad-8656-31e1d96e0571";
const PRIVATE_KEY_RAW = "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIADE7F++QawcWU5iZfqmo8iupxBkqfJsFV0KsTaGpRpLoAoGCCqGSM49\nAwEHoUQDQgAEhSKrrlzJxIh6hgr5fT0cZf3NO91/a6kRPkWRNG6kQlLW8FIzJ53Y\nDgbh5U2Zj3zlxHWivwVyZGMWMf8xEdxYXw==\n-----END EC PRIVATE KEY-----\n";

const cleanKey = (key) => key ? key.replace(/\\n/g, '\n').trim() : "";
const PRIVATE_KEY = cleanKey(PRIVATE_KEY_RAW);

let isEmergencyStopped = false;

try {
  Coinbase.configure({ apiKeyName: API_KEY_NAME, privateKey: PRIVATE_KEY });
  console.log("✅ Spectral AI Core: Authenticated.");
} catch (err) {
  console.error("❌ Authentication Error:", err.message);
}

// Health Check
app.get('/', (req, res) => {
    res.json({ status: "Online", engine: "Spectral AI" });
});

app.get('/api/status', (req, res) => {
    res.json({ isEmergencyStopped });
});

app.post('/api/emergency-stop', (req, res) => {
    if (req.body && typeof req.body.stop === 'boolean') {
        isEmergencyStopped = req.body.stop;
        res.json({ success: true, isEmergencyStopped });
    } else {
        res.status(400).json({ error: "Invalid body" });
    }
});

app.get('/api/portfolio', async (req, res) => {
    try {
        console.log("🔄 Fetching Portfolio...");
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
                    } catch (e) { console.warn(`Price skip for ${symbol}`); }
                }
                portfolio.push(asset);
            }
        }

        // اگر هیچ کیف پولی نبود، دیتای نمایشی بفرست
        if (portfolio.length === 0) {
            portfolio = [
                { symbol: 'EUR', name: 'Euro', balance: 500.00, currentPrice: 1, entryPrice: 1, roi: 0, type: 'FIAT' },
                { symbol: 'BTC', name: 'Bitcoin', balance: 0.002, entryPrice: 60000, currentPrice: 65000, roi: 8.33, type: 'CRYPTO' }
            ];
        }
        res.json(portfolio);
    } catch (e) {
        console.error("❌ Portfolio Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/signals', (req, res) => res.json([]));
app.get('/api/trades', (req, res) => res.json([]));

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server on port ${PORT}`);
});
