
import { GoogleGenAI, Type } from "@google/genai";
import { Order, Product } from "../types";

export const getBusinessInsights = async (orders: Order[], inventory: Product[], prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const context = `
    You are a professional business analyst for an Indian electrical and home appliance company named "Tevolta Enterprises".
    Current Inventory: ${JSON.stringify(inventory.map(p => ({ name: p.name, stock: p.stock, price: p.price, hsn: p.hsnCode, watts: p.watts })))}
    Order History Summary: ${JSON.stringify(orders.map(o => ({ total: o.totalAmount, tax: o.totalTax, date: o.date, items: o.items.length })))}
    
    The user is asking: "${prompt}"
    
    Provide a concise, professional answer focusing on sales trends, inventory alerts, or business growth suggestions within the Indian retail market context. Mention GST impact where relevant.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context,
    });
    return response.text || "I'm sorry, I couldn't generate an insight at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI advisor.";
  }
};

/**
 * Analyzes an invoice which can be an image/pdf (multimodal) or extracted text (excel).
 */
export const analyzeInvoice = async (data: string, type: 'multimodal' | 'text', mimeType?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze this purchase invoice from a supplier (likely China/Global). 
    Extract the following details as JSON:
    1. Supplier Name
    2. Currency (USD, CNY, or INR)
    3. Items: List of objects with { sku, name, quantity, costPerUnit, watts }
    4. Total Amount
    
    Specific Rules for items:
    - If there is a Product ID or SKU like "UT-50-...", extract it into the "sku" field.
    - If product names are in Chinese, translate them to English. 
    - For LED flood lights, look for wattage (e.g., 50W, 100W, 200W) in the description and put it in the "watts" field.
    - Ensure numbers are parsed correctly. 
    - If the data is provided as text (from a spreadsheet), interpret the columns accurately.
  `;

  try {
    let contents;
    if (type === 'multimodal') {
      contents = {
        parts: [
          { text: prompt },
          { inlineData: { data: data, mimeType: mimeType || 'image/jpeg' } }
        ]
      };
    } else {
      contents = {
        parts: [
          { text: prompt },
          { text: `INVOICE DATA EXTRACTED FROM SPREADSHEET:\n${data}` }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplierName: { type: Type.STRING },
            currency: { type: Type.STRING, description: "USD, CNY, or INR" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  // Fix: Removed 'nullable' property as it is not explicitly supported in the simplified Schema guidelines
                  sku: { type: Type.STRING },
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  costPerUnit: { type: Type.NUMBER },
                  // Fix: Removed 'nullable' property as it is not explicitly supported in the simplified Schema guidelines
                  watts: { type: Type.STRING }
                }
              }
            },
            totalAmount: { type: Type.NUMBER }
          }
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Invoice Analysis Error:", error);
    throw error;
  }
};
