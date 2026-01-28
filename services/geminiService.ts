
import { GoogleGenAI, Type } from "@google/genai";
import { Order, Product } from "../types";

export const getBusinessInsights = async (orders: Order[], inventory: Product[], prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Summarize data to avoid payload size issues and timeouts
  const summarizedInventory = inventory.slice(0, 30).map(p => ({
    sku: p.id,
    name: p.name,
    stock: p.stock,
    price: p.price,
    watts: p.watts
  }));

  const summarizedOrders = orders.slice(0, 20).map(o => ({
    total: o.totalAmount,
    date: o.date,
    itemCount: o.items.length
  }));

  const contextText = `
    You are a professional business analyst for "Tevolta Enterprises", an Indian electrical company.
    Total SKU Count: ${inventory.length}
    Total Orders in System: ${orders.length}
    
    RECENT INVENTORY SNAPSHOT (Top 30):
    ${JSON.stringify(summarizedInventory)}
    
    RECENT SALES HISTORY (Last 20):
    ${JSON.stringify(summarizedOrders)}
    
    User Query: "${prompt}"
    
    Provide a concise, expert response in 2-3 short paragraphs. Focus on trends, stock risks, or profit opportunities.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: contextText }] }],
    });
    return response.text || "I'm sorry, I couldn't generate an insight at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The AI service is currently experiencing a timeout or connection issue. Please try a simpler question or check your internet connection.";
  }
};

export const extractSupplierData = async (fileBase64: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    ACT AS A HIGH-PRECISION FINANCIAL EXTRACTION ENGINE. 
    Analyze the attached invoice and extract data into STRICT JSON format.

    TARGET JSON STRUCTURE:
    {
      "supplierName": string,
      "date": string (YYYY-MM-DD),
      "currency": "USD" | "CNY" | "INR",
      "totalAmount": number,
      "deposit": number,
      "remainingBalance": number,
      "exchangeRate": number,
      "items": [
        { 
          "supplierSku": string, 
          "name": string, 
          "watts": string,
          "quantity": number, 
          "price": number
        }
      ]
    }
    RETURN ONLY THE JSON OBJECT.
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
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Extraction Error:", error);
    throw new Error("AI failed to process this invoice.");
  }
};
