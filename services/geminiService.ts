import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import { FinancialData } from "../types";

// Define the function tool for the model to update the dashboard
const updateFinancialProfileTool: FunctionDeclaration = {
  name: 'updateFinancialProfile',
  description: 'Update the user\'s financial profile with extracted data such as income, expenses, location, goals, and savings. Call this whenever the user provides specific numbers or details.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING, description: 'The user\'s city or region.' },
      monthlyIncome: { type: Type.NUMBER, description: 'Total monthly income.' },
      monthlyExpenses: { type: Type.NUMBER, description: 'Total monthly living expenses.' },
      savings: { type: Type.NUMBER, description: 'Current savings amount.' },
      goals: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: 'List of financial goals.' 
      },
      budgetBreakdown: {
        type: Type.ARRAY,
        description: 'Suggested budget categories based on the 50/30/20 rule or modified for their situation.',
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            color: { type: Type.STRING, description: 'Hex color code for the chart' }
          }
        }
      },
      recommendations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Specific actionable advice for saving money or budgeting.'
      }
    }
  }
};

let chatSession: Chat | null = null;
let aiInstance: GoogleGenAI | null = null;

const SYSTEM_INSTRUCTION = `
You are Penny, a warm, empathetic, and non-judgmental financial advisor. 
Your target audience is middle-class individuals who often live paycheck to paycheck and feel anxious about money.
Your goal is to make them feel safe, heard, and empowered.

Style:
- Speak simply. Avoid finance jargon.
- Be conversational and encouraging (e.g., "It's completely normal to feel that way," "That's a great start").
- Do not be pushy.
- Keep responses concise but helpful.

Process:
1. Start by gently introducing yourself and asking how they are feeling about their finances today or where they are located.
2. Gradually gather information about:
   - Location (affects cost of living)
   - Monthly Income (roughly)
   - Monthly Expenses (roughly)
   - Financial Goals (e.g., save for a car, pay off debt, just breathe easier)
3. As you learn these details, ALWAYS call the 'updateFinancialProfile' tool to update their dashboard. Even partial updates are good.
4. Once you have a clear picture, provide a "Low Stress Plan".
   - Suggest a realistic budget.
   - Suggest low-risk ways to save (high yield savings, cutting unused subscriptions).
   - Suggest specific expense reductions based on their location if possible.

Constraints:
- NEVER ask for PII (personally identifiable information) like bank account numbers, full address, or last names.
- If the user is stressed, prioritize emotional support over math.
- Use the 'updateFinancialProfile' tool frequently to visualize their data.
`;

export const initializeChat = (): Chat => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  chatSession = aiInstance.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: [updateFinancialProfileTool] }],
    },
  });

  return chatSession;
};

export const sendMessageToGemini = async (
  message: string, 
  onToolCall: (data: Partial<FinancialData>) => void
): Promise<string> => {
  if (!chatSession) {
    initializeChat();
  }

  if (!chatSession) throw new Error("Chat session failed to initialize");

  try {
    const result = await chatSession.sendMessage({ message });
    
    // Handle function calls if any
    const functionCalls = result.candidates?.[0]?.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall);
    
    let finalResponseText = result.text || "";

    if (functionCalls && functionCalls.length > 0) {
      const toolResponses = [];
      
      for (const call of functionCalls) {
        if (call && call.name === 'updateFinancialProfile') {
          // Execute the "tool" - which in this app means updating the React state
          onToolCall(call.args as unknown as Partial<FinancialData>);
          
          toolResponses.push({
            name: call.name,
            response: { result: "Dashboard updated successfully." },
            id: call.id
          });
        }
      }

      // Send the tool response back to the model so it can continue the conversation
      if (toolResponses.length > 0) {
         const toolResponseParts = toolResponses.map(tr => {
            // Strictly construct the FunctionResponse part
            // The SDK expects { functionResponse: { name, response, id? } }
            // We must handle the 'id' field carefully.
            const part: any = {
                functionResponse: {
                    name: tr.name,
                    response: tr.response,
                }
            };
            if (tr.id) {
                part.functionResponse.id = tr.id;
            }
            return part;
         });
       
         const followUp = await chatSession.sendMessage({ message: toolResponseParts });
         finalResponseText = followUp.text || "";
      }
    }

    return finalResponseText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having a little trouble connecting to my financial brain right now. Can we try that again?";
  }
};