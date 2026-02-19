import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession, UserRole } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
