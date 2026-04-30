"use client";

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: string;
    color?: string;
}

export default function StatCard({ title, value, icon, trend, color }: StatCardProps) {
    return (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-5 rounded-2xl group hover:border-gray-200 dark:hover:border-[#222] transition-all duration-300 shadow-sm dark:shadow-none">
            <div className="flex justify-between items-start mb-5">
                <div className={`text-gray-400 dark:text-[#333] group-hover:text-gray-600 dark:group-hover:text-[#666] transition-colors p-2.5 bg-gray-50 dark:bg-black rounded-xl border border-gray-100 dark:border-[#1a1a1a] ${color}`}>
                    {icon}
                </div>
                {trend && (
                    <div className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-500">
                        {trend}
                    </div>
                )}
            </div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-[#444] mb-1.5 uppercase tracking-widest">{title}</p>
            <h4 className="text-2xl font-black text-gray-900 dark:text-gray-100 tabular-nums tracking-tight group-hover:translate-x-1 transition-transform">{value}</h4>
        </div>
    );
}
