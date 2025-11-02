import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d']; 

export default function MonthlyReportChart({ data }) {
  const chartData = [
    { name: 'Haircut', value: data.haircut || 0 },
    { name: 'Tattoo', value: data.tattoo || 0 }
  ];

  const total = chartData[0].value + chartData[1].value;

  if (total === 0)
    return <p style={{ textAlign: 'center', color: '#ccc' }}>No service data this month.</p>;

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            dataKey="value"
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={70}
            fill="#8884d8"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: '#d8d8d8ff', border: '1px solid #555' }} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '5px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
