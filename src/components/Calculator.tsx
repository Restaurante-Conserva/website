'use client';

import { useState } from 'react';
import { Calculator as CalcIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CalculatorWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [display, setDisplay] = useState('0');
    const [history, setHistory] = useState('');
    const [isResult, setIsResult] = useState(false);

    const toggle = () => setIsOpen(!isOpen);

    const handlePress = (val: string) => {
        if (val === 'C') {
            setDisplay('0');
            setHistory('');
            return;
        }

        if (val === 'DEL') {
            if (isResult) {
                setDisplay('0');
                setIsResult(false);
            } else {
                setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
            }
            return;
        }

        if (val === '=') {
            try {
                // eslint-disable-next-line
                const res = eval(history + display);
                setDisplay(String(res));
                setHistory('');
                setIsResult(true);
            } catch {
                setDisplay('Error');
            }
            return;
        }

        if (['+', '-', '*', '/'].includes(val)) {
            setHistory(display + ((val === '*') ? '*' : (val === '/') ? '/' : val));
            setDisplay('0');
            setIsResult(false);
            return;
        }

        if (isResult) {
            setDisplay(val);
            setIsResult(false);
            return;
        }

        setDisplay(prev => prev === '0' ? val : prev + val);
    };

    const buttons = [
        { label: 'C', type: 'func', val: 'C' },
        { label: '÷', type: 'op', val: '/' },
        { label: '×', type: 'op', val: '*' },
        { label: 'DEL', type: 'func', val: 'DEL' },
        { label: '7', type: 'num', val: '7' },
        { label: '8', type: 'num', val: '8' },
        { label: '9', type: 'num', val: '9' },
        { label: '-', type: 'op', val: '-' },
        { label: '4', type: 'num', val: '4' },
        { label: '5', type: 'num', val: '5' },
        { label: '6', type: 'num', val: '6' },
        { label: '+', type: 'op', val: '+' },
        { label: '1', type: 'num', val: '1' },
        { label: '2', type: 'num', val: '2' },
        { label: '3', type: 'num', val: '3' },
        { label: '=', type: 'eq', val: '=' },
        { label: '0', type: 'num', val: '0', wide: true },
        { label: '.', type: 'num', val: '.' },
    ];

    return (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-4">
            {isOpen && (
                <div className="bg-gray-900 w-72 rounded-3xl shadow-2xl border border-gray-800 p-5 animate-in slide-in-from-bottom-10 fade-in duration-200">
                    <div className="mb-4 text-right">
                        <div className="text-gray-400 text-xs h-4 font-mono overflow-hidden">{history}</div>
                        <div className="text-white text-4xl font-light overflow-x-auto scrollbar-hide flex justify-end">
                            {display}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {buttons.map((btn, i) => (
                            <button
                                key={i}
                                onClick={() => handlePress(btn.val)}
                                className={cn(
                                    "h-14 rounded-full flex items-center justify-center text-xl font-medium transition-all active:scale-95",
                                    btn.wide && "col-span-2",
                                    btn.type === 'num' && "bg-gray-700 text-white hover:bg-gray-600",
                                    btn.type === 'op' && "bg-orange-500 text-white hover:bg-orange-400 font-bold text-2xl pb-1",
                                    btn.type === 'func' && "bg-gray-300 text-black hover:bg-gray-200 text-sm font-bold",
                                    btn.type === 'eq' && "row-span-2 bg-orange-500 h-full text-white"
                                )}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={toggle}
                className={cn(
                    "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95",
                    isOpen ? "bg-red-500 text-white rotate-180" : "bg-gray-900 text-white"
                )}
            >
                {isOpen ? <X className="w-6 h-6" /> : <CalcIcon className="w-6 h-6" />}
            </button>
        </div>
    );
}
