import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ProductResult {
  name: string;
  price: string;
  marketplace: string;
  link: string;
  imageUrl: string;
  rating?: string;
  reviewsCount?: string;
  shippingInfo?: string;
}

export interface ComparisonResult {
  productName: string;
  description: string;
  bestPrice: string;
  bestMarketplace: string;
  results: ProductResult[];
}

export async function searchProduct(query: string, imageBase64?: string): Promise<ComparisonResult> {
  const prompt = imageBase64 
    ? `Identifique o produto na imagem. Busque e compare preços reais em: Mercado Livre, Amazon.com.br, Magalu e Shopee Brasil. Use "${query}" se ajudar.`
    : `Busque e compare preços reais de "${query}" em: Mercado Livre, Amazon.com.br, Magalu e Shopee Brasil.`;

  const contents: any = {
    parts: [
      { text: prompt + `
    Retorne JSON:
    1. productName: Nome curto.
    2. description: Resumo (máx 150 chars).
    3. bestPrice: Menor preço encontrado (R$).
    4. bestMarketplace: Loja do menor preço.
    5. results: Lista com [name, price, marketplace, link, imageUrl, rating, reviewsCount, shippingInfo].
    
    Importante: Use links reais e imagens diretas.` }
    ]
  };

  if (imageBase64) {
    contents.parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          description: { type: Type.STRING },
          bestPrice: { type: Type.STRING },
          bestMarketplace: { type: Type.STRING },
          results: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.STRING },
                marketplace: { type: Type.STRING },
                link: { type: Type.STRING },
                imageUrl: { type: Type.STRING },
                rating: { type: Type.STRING },
                reviewsCount: { type: Type.STRING },
                shippingInfo: { type: Type.STRING },
              },
              required: ["name", "price", "marketplace", "link", "imageUrl"],
            },
          },
        },
        required: ["productName", "description", "bestPrice", "bestMarketplace", "results"],
      },
    },
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  try {
    return JSON.parse(response.text) as ComparisonResult;
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Invalid response format from AI");
  }
}
