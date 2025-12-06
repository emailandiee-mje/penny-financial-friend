import React from 'react';
import { FinancialData } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Wallet, Target, TrendingDown, MapPin, PiggyBank } from 'lucide-react';

interface Props {
  data: FinancialData;
}

const FinancialDashboard: React.FC<Props> = ({ data }) => {
  const hasData = data.monthlyIncome > 0 || data.monthlyExpenses > 0;
  
  // Prepare data for the pie chart
  // If we have specific breakdown from AI, use it. Otherwise, generate a simple Income vs Expense or remaining.
  let chartData = data.budgetBreakdown && data.budgetBreakdown.length > 0 
    ? data.budgetBreakdown 
    : [
        { name: 'Expenses', value: data.monthlyExpenses, color: '#f87171' },
        { name: 'Remaining', value: Math.max(0, data.monthlyIncome - data.monthlyExpenses), color: '#4ade80' }
      ];

  // Clean up chart data for Recharts (needs name/value)
  const formattedChartData = chartData.map(d => ({
    name: d.category || d.name,
    value: d.amount || d.value,
    color: d.color
  })).filter(d => d.value > 0);

  if (!hasData) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-sage-600 p-8 text-center bg-white/50 rounded-3xl border-2 border-dashed border-sage-200">
        <PiggyBank className="w-16 h-16 mb-4 text-sage-300" />
        <h3 className="text-xl font-semibold mb-2">Your Financial Snapshot</h3>
        <p>Chat with Penny to build your personalized plan. As you share details, I'll organize them here.</p>
      </div>
    );
  }

  const net = data.monthlyIncome - data.monthlyExpenses;
  const isPositive = net >= 0;

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 space-y-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-sage-100">
      <div className="flex justify-between items-start">
        <div>
           <h2 className="text-2xl font-bold text-sage-900">Your Plan</h2>
           {data.location && (
             <div className="flex items-center text-sage-500 text-sm mt-1">
               <MapPin className="w-3 h-3 mr-1" />
               {data.location}
             </div>
           )}
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
           {isPositive ? 'On Track' : 'Needs Review'}
        </div>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-sage-50 p-4 rounded-2xl">
          <p className="text-xs text-sage-500 uppercase tracking-wide">Income</p>
          <p className="text-xl font-bold text-sage-800">${data.monthlyIncome.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl">
          <p className="text-xs text-red-500 uppercase tracking-wide">Expenses</p>
          <p className="text-xl font-bold text-red-800">${data.monthlyExpenses.toLocaleString()}</p>
        </div>
      </div>

      {/* Savings Goal */}
      {(data.savings > 0 || net > 0) && (
        <div className="bg-blue-50 p-4 rounded-2xl flex items-center justify-between">
           <div>
             <p className="text-xs text-blue-500 uppercase tracking-wide">Potential Savings</p>
             <p className="text-lg font-bold text-blue-800">
               ${data.savings > 0 ? data.savings.toLocaleString() : net.toLocaleString()}
               <span className="text-xs font-normal text-blue-600 ml-1">/ mo</span>
             </p>
           </div>
           <Wallet className="w-6 h-6 text-blue-400" />
        </div>
      )}

      {/* Chart */}
      <div className="h-64 w-full relative">
         <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedChartData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {formattedChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
         </ResponsiveContainer>
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-xs text-gray-400">Net</p>
              <p className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}${net.toLocaleString()}
              </p>
            </div>
         </div>
      </div>

      {/* Goals */}
      {data.goals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-sage-800 mb-3 flex items-center">
            <Target className="w-4 h-4 mr-2" /> Goals
          </h3>
          <ul className="space-y-2">
            {data.goals.map((goal, idx) => (
              <li key={idx} className="flex items-start text-sm text-sage-700 bg-white p-2 rounded-lg border border-sage-100">
                <span className="mr-2">•</span> {goal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-sage-800 mb-3 flex items-center">
            <TrendingDown className="w-4 h-4 mr-2" /> Penny's Tips
          </h3>
          <ul className="space-y-2">
            {data.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-sage-600 bg-green-50/50 p-3 rounded-xl">
                 {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;