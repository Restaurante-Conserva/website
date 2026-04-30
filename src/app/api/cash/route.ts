import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    const activeCash = await db.getActiveCashRegister();
    return NextResponse.json(activeCash);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'open') {
            const { initialAmount, openedBy } = body;
            const register = await db.openCashRegister(initialAmount, openedBy);
            return NextResponse.json(register);
        }

        if (action === 'close') {
            const { finalAmount, closedBy } = body;
            const register = await db.closeCashRegister(finalAmount, closedBy);
            return NextResponse.json(register);
        }

        if (action === 'transaction') {
            const { amount, type, description } = body;
            const register = await db.addCashTransaction(amount, type, description);
            return NextResponse.json(register);
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
