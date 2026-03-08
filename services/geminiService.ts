
import { GoogleGenAI, Type } from "@google/genai";
import { Order, Product } from "../types";

/**
 * Utility to handle business intelligence queries using the Gemini 3 Pro model.
 * 'gemini-3-pro-preview' is selected for complex business intelligence and data analysis tasks.
 */
export const getBusinessInsights = async (orders: Order[], inventory: Product[], prompt: string) => {
  // Initialize inside the function to ensure the latest API Key from process.env is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Summarize data to stay within token limits and reduce latency
  const summarizedInventory = inventory.slice(0, 40).map(p => ({
    sku: p.id,
    name: p.name,
    stock: p.stock,
    price: p.price,
    watts: p.watts || 'N/A'
  }));

  const summarizedOrders = orders.slice(0, 20).map(o => ({
    total: o.totalAmount,
    date: o.date,
    itemCount: o.items.length
  }));

  const contextText = `
    You are the "Tevolta Business Intelligence Assistant". 
    Company: Tevolta Enterprises (Indian Electrical & Appliances)
    
    Current System Stats:
    - Inventory SKUs: ${inventory.length}
    - Total Orders: ${orders.length}
    
    Data Snapshot for Analysis:
    INVENTORY (Sample): ${JSON.stringify(summarizedInventory)}
    RECENT SALES (Sample): ${JSON.stringify(summarizedOrders)}
    
    User Question: "${prompt}"
    
    Instructions:
    - Provide a professional, data-driven response.
    - If suggesting stock updates, mention specific SKUs.
    - Keep the response concise (max 3 paragraphs).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: contextText }] }],
    });

    return response.text || "I processed the data but couldn't formulate a specific insight. Please try rephrasing.";
  } catch (error: any) {
    console.error("Gemini BI Error:", error);
    
    if (error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return "NOTICE: The AI service has reached its free-tier limit for this minute. Please wait about 60 seconds and try your request again.";
    }
    
    return "The AI service is temporarily unavailable. Please check your internet or try again in a few moments.";
  }
};

/**
 * Extracts structured JSON data from invoice images/PDFs using Gemini 3 Flash.
 */
export const extractSupplierData = async (fileBase64: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    ACT AS A FINANCIAL DATA EXTRACTION BOT.
    Extract all billing details from this invoice.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplierName: { type: Type.STRING },
            date: { type: Type.STRING, description: "ISO 8601 Date string YYYY-MM-DD" },
            currency: { type: Type.STRING, description: "USD | CNY | INR" },
            totalAmount: { type: Type.NUMBER },
            deposit: { type: Type.NUMBER },
            remainingBalance: { type: Type.NUMBER },
            exchangeRate: { type: Type.NUMBER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  supplierSku: { type: Type.STRING },
                  name: { type: Type.STRING },
                  watts: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  price: { type: Type.NUMBER }
                }
              }
            }
          },
          required: ["supplierName", "date", "currency", "totalAmount", "items"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("AI Invoice Extraction Error:", error);
    throw new Error("The AI could not read this file clearly. Please ensure the photo is bright and clear.");
  }
};
