import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Customer } from '@/models/Schemas';
import dbConnect from '@/lib/mongoose';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        // Se for um abate de dívida (debtAbatement)
        if (body.debtAbatement) {
            const amount = parseFloat(body.debtAbatement);
            const customer = await Customer.findById(id);
            if (!customer) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });

            customer.debtBalance = Math.max(0, (customer.debtBalance || 0) - amount);
            console.log(`[CUSTOMER API] Abating ${amount} from ${customer.name}. New Balance: ${customer.debtBalance}`);
            customer.debtHistory.push({
                date: new Date(),
                type: 'payment',
                description: 'Recebimento de Fiado (Painel)',
                amount: amount
            });
            await customer.save();
            return NextResponse.json(customer);
        }

        const customer = await db.updateCustomer(id, body);
        return NextResponse.json(customer);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
