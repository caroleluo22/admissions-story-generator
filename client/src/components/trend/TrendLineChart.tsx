import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart
} from 'recharts';
import { TrendDataPoint } from '../../types/trend';

interface TrendLineChartProps {
    data: TrendDataPoint[];
}

const TrendLineChart: React.FC<TrendLineChartProps> = ({ data }) => {
    return (
        <div className="w-full h-[400px] bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-lg flex flex-col">
            <h3 className="text-slate-400 text-sm uppercase tracking-wider font-semibold mb-4 shrink-0">6-Month Trend Velocity</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: 'Interest', angle: -90, position: 'insideLeft', fill: '#8b5cf6' }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            domain={[-100, 100]}
                            label={{ value: 'Sentiment', angle: 90, position: 'insideRight', fill: '#10b981' }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="interestScore"
                            name="Search Interest"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorInterest)"
                        />

                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="sentimentScore"
                            name="Net Sentiment"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrendLineChart;
