"use client";

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: string;
    color?: string;
    accentColor?: string;
}

export default function StatCard({ title, value, icon, trend, color, accentColor = 'orange' }: StatCardProps) {
    const accentMap: Record<string, string> = {
        orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-100 dark:border-orange-500/20',
        emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-500/20',
        blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-100 dark:border-blue-500/20',
        violet: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-500 border-violet-100 dark:border-violet-500/20',
    };
    const accent = accentMap[accentColor] || accentMap.orange;

    return (
        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#1a1a1a] p-6 rounded-2xl group hover:border-gray-200 dark:hover:border-[#2a2a2a] hover:shadow-lg dark:hover:shadow-none transition-all duration-200">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3.5 rounded-xl border ${accent} transition-all group-hover:scale-110 duration-300`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${color === 'text-green-500' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20'}`}>
                        {trend}
                    </div>
                )}
            </div>
            <p className="text-xs font-bold text-gray-500 dark:text-[#444] tracking-widest mb-2 uppercase">{title}</p>
            <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums">{value}</h4>
        </div>
    );
}
