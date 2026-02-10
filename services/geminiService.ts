
import { GoogleGenAI, Type } from "@google/genai";
import { MarketAnalysis } from "../types";

export const analyzeMarket = async (symbol: string, marketData: any): Promise<MarketAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    SYSTEM: You are the 'SPECTRAL OVERLORD' Institutional Trading Engine.
    ASSET: ${symbol}
    MARKET DATA: ${JSON.stringify(marketData)}
    
    CRITICAL PROTOCOLS:
    1. NET ALPHA FOCUS: Calculate ROI after 1.2% total exchange fees. If net is < 2%, ignore.
    2. ANTI-RETAIL BIAS: Retail traders use RSI/MACD. You use Order Flow and Trap Detection.
    3. TRAP DETECTION: Scan for:
       - Liquidity Wicks (Stop-loss hunting)
       - Wash Trading (Fake volume)
       - Spoofing (Fake buy/sell walls)
    4. SHADOW EXECUTION:
       - SHADOW TARGET: 0.2% below the nearest major sell wall.
       - DEAD-ZONE SL: 0.3% below the obvious support where retail stops are clustered.
    5. CAPITAL ROTATION: If confidence is >95%, recommend liquidating weaker assets.

    Respond ONLY in JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 12000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            recommendedAction: { type: Type.STRING },
            netRoiEstimate: { type: Type.NUMBER },
            shadowTarget: { type: Type.NUMBER },
            deadZoneSL: { type: Type.NUMBER },
            isTrap: { type: Type.BOOLEAN },
            trapType: { type: Type.STRING },
            institutionalFlow: { type: Type.STRING, description: "ACCUMULATION, DISTRIBUTION, NEUTRAL" }
          },
          required: ["sentiment", "confidence", "reasoning", "recommendedAction", "netRoiEstimate", "shadowTarget", "deadZoneSL", "isTrap", "institutionalFlow"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Spectral analysis failed:", error);
    throw error;
  }
};
