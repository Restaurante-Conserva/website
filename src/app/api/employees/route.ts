import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    const employees = await db.getEmployees();
    return NextResponse.json(employees);
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
        await db.deleteEmployee(id);
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, password, data } = body;

        if (action === 'verify') {
            const employee = await db.getEmployeeByPassword(password);
            if (employee) return NextResponse.json(employee);
            return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
        }

        if (action === 'add') {
            const employee = await db.addEmployee(data);
            return NextResponse.json(employee);
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
