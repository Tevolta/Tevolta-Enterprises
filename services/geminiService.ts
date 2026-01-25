
import { GoogleGenAI, Type } from "@google/genai";
import { Order, Product } from "../types";

export const getBusinessInsights = async (orders: Order[], inventory: Product[], prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const context = `
    You are a professional business analyst for an Indian electrical and home appliance company named "Tevolta Enterprises".
    Current Inventory: ${JSON.stringify(inventory.map(p => ({ name: p.name, stock: p.stock, price: p.price, hsn: p.hsnCode, watts: p.watts })))}
    Order History Summary: ${JSON.stringify(orders.map(o => ({ total: o.totalAmount, tax: o.totalTax, date: o.date, items: o.items.length })))}
    
    The user is asking: "${prompt}"
    
    Provide a concise, professional answer focusing on sales trends, inventory alerts, or business growth suggestions.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context,
    });
    // Fix: response.text is a property getter, not a method
    return response.text || "I'm sorry, I couldn't generate an insight at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI advisor.";
  }
};

export const extractSupplierData = async (fileBase64: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    ACT AS A HIGH-PRECISION FINANCIAL EXTRACTION ENGINE FOR ELECTRICAL APPLIANCES. 
    Analyze the attached invoice and extract data into a STRICT JSON format.

    TARGET JSON STRUCTURE:
    {
      "supplierName": string,
      "date": string (YYYY-MM-DD),
      "currency": "USD" | "CNY" | "INR",
      "totalAmount": number (Grand total in invoice currency),
      "deposit": number (Amount paid as advance),
      "remainingBalance": number,
      "exchangeRate": number (Suggest: 83 for USD, 12 for CNY),
      "items": [
        { 
          "supplierSku": string (The ID given by the supplier/manufacturer), 
          "name": string (Description of the appliance), 
          "watts": string (Power rating e.g., "50W"),
          "quantity": number, 
          "price": number (Unit cost in invoice currency)
        }
      ]
    }

    CRITICAL INSTRUCTIONS:
    1. Look for "¥" or "RMB" -> Currency MUST be "CNY".
    2. Look for "$" -> Currency MUST be "USD".
    3. Extract the "Watts" if mentioned in product description.
    4. RETURN ONLY THE JSON OBJECT.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Fix: Always wrap multiple parts in a { parts: [...] } object per guidelines
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

    // Fix: response.text is a property getter
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Extraction Error:", error);
    throw new Error("AI failed to process this invoice.");
  }
};
