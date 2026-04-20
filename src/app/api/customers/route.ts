import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const cpf = searchParams.get('cpf');

    if (cpf) {
        const customer = await db.findCustomerByCpf(cpf);
        return NextResponse.json(customer);
    }

    const customers = await db.getCustomers();
    return NextResponse.json(customers);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const customer = await db.addCustomer(body);
        return NextResponse.json(customer);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...data } = body;
        const customer = await db.updateCustomer(id, data);
        return NextResponse.json(customer);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
