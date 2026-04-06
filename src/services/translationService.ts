import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey });

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text || !targetLanguage || targetLanguage === 'en') return text;

  try {
    const prompt = `You are a professional translator. Translate the following text into ${targetLanguage}. 
      Maintain the original tone and meaning. 
      Return ONLY the translated text. 
      Do not include any explanations, notes, or original text.
      
      Text to translate:
      ${text}`;

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1, // Low temperature for consistent translation
      }
    });

    const translated = response.text?.trim();
    return translated || text;
  } catch (error) {
    console.error("Translation error for text:", text.substring(0, 20), error);
    return text;
  }
}

export async function translateArticle(article: any, targetLanguage: string) {
  if (article.language === targetLanguage) return article;

  const fieldsToTranslate = ['title', 'summary', 'content'];
  const translatedArticle = { ...article };

  // Translate sequentially to avoid rate limits
  for (const field of fieldsToTranslate) {
    if (article[field]) {
      translatedArticle[field] = await translateText(article[field], targetLanguage);
    }
  }

  return translatedArticle;
}

export async function translateUpdate(update: any, targetLanguage: string) {
  if (update.language === targetLanguage) return update;

  const translatedUpdate = { ...update };
  if (update.content) {
    translatedUpdate.content = await translateText(update.content, targetLanguage);
  }

  return translatedUpdate;
}
