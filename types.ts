export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface FinancialData {
  location: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  currency: string;
  goals: string[];
  budgetBreakdown: { category: string; amount: number; color: string }[];
  recommendations: string[];
}

export interface ToolCallResponse {
  functionResponses: {
    name: string;
    response: object;
  }[];
}

export enum ViewMode {
  CHAT = 'CHAT',
  DASHBOARD = 'DASHBOARD',
  SPLIT = 'SPLIT' // For desktop
}