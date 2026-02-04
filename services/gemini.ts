import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function summarizeDailyJourney(checkIns: any[]) {
  const names = checkIns.map(c => c.name).join(", ");
  const addresses = checkIns.map(c => c.address).join(" | ");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this user's daily coffee trail: Venues: ${names}. Locations: ${addresses}. 
    Calculate stats and provide a pithy, companion-like summary. 
    If the locations suggest a city/neighborhood jump (e.g., Kadıköy to Beşiktaş), flag it as a routine change.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "Short, pithy summary as a companion (max 150 chars)." },
          distanceKm: { type: Type.NUMBER, description: "Estimated distance traveled today in km." },
          neighborhoods: { type: Type.STRING, description: "Neighborhoods visited (e.g., 'Kadıköy, Moda')." },
          venueCount: { type: Type.INTEGER, description: "Total venues visited." },
          isRoutineChange: { type: Type.BOOLEAN, description: "Whether today's route is significantly different from a typical day." },
          interactivePrompt: { type: Type.STRING, description: "A punchy question or action if routine changed (e.g. 'Galata mı? Yarın da Karaköy turu yapalım mı?')." }
        },
        required: ["summary", "distanceKm", "neighborhoods", "venueCount", "isRoutineChange"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function fetchTrendingCafes(location: string = "Istanbul") {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find the top 5 trending, newly opened, or most reviewed coffee shops in ${location} for this month. 
    Focus on places with unique concepts or high work-friendliness ratings. 
    Provide a list with name, description, and why they are trending.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text;
  const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || "Source",
    uri: chunk.web?.uri || "#"
  })) || [];

  return { text, links };
}

export async function fetchCafeLiveBuzz(cafeName: string, address: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Research the latest reviews and social media buzz for "${cafeName}" located at "${address}". 
    Summarize the current sentiment, most mentioned positive/negative points, and if there are any recent changes in their menu or hours. 
    Keep it concise and helpful for someone looking to work there.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text;
  const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || "Review Source",
    uri: chunk.web?.uri || "#"
  })) || [];

  return { text, links };
}

export async function fetchSentimentCollections(location: string, sentiment: string) {
  // This function simulates fetching grouped collections based on specific praise points (e.g. "Best Garden")
  // using Google Maps Grounding data.
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Find coffee shops in ${location} that are specifically highly praised for their "${sentiment}" in reviews.`,
    config: {
      tools: [{ googleMaps: {} }],
    },
  });

  // Logic to parse chunks would go here, returning a structured list.
  return response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
}


