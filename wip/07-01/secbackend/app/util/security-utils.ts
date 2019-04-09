import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export function hashPassword(clearTextPassword: string): string {
    const salt = genSaltSync(12);
    const hashedPassword = hashSync(clearTextPassword, salt);
    return hashedPassword;
}

export function verifyPassword(passwordAttempted: string, passwordHashed: string): boolean {
    return compareSync(passwordAttempted, passwordHashed);
}

export function createToken(userId: string, userEmail: string): string {
    const payload = {
        email: userEmail,
        id: userId
    };
    const secret = process.env.SECRET;
    const signedToken = sign(payload, secret!, {
        algorithm: 'HS256',
        expiresIn: '1h'
    });
    return signedToken;
}