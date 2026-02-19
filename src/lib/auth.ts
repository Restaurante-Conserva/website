import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode('super-secret-conserva-key-2025');

export type UserRole = 'admin' | 'employee';

export async function createSession(payload: { role: UserRole }) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('12h') // 12 hours session
        .sign(SECRET_KEY);
}

export async function verifySession(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY, {
            algorithms: ['HS256'],
        });
        return payload as { role: UserRole };
    } catch (error) {
        return null;
    }
}

export function validateLogin(password: string): UserRole | null {
    if (password === 'conserva@2013') return 'admin';
    if (password === '2013') return 'employee';
    return null;
}
