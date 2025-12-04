'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Lun', leads: 4 },
    { name: 'Mar', leads: 3 },
    { name: 'Mer', leads: 7 },
    { name: 'Jeu', leads: 5 },
    { name: 'Ven', leads: 8 },
    { name: 'Sam', leads: 12 },
    { name: 'Dim', leads: 9 },
];

export default function DashboardChart() {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#71717a"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#71717a"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                        itemStyle={{ color: '#3b82f6' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="leads"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorLeads)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
