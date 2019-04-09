import { compareSync, genSaltSync, hashSync } from 'bcryptjs';

export function hashPassword(clearTextPassword: string): string {
    const salt = genSaltSync(12);
    const hashedPassword = hashSync(clearTextPassword, salt);
    return hashedPassword;
}

export function verifyPassword(passwordAttempted: string, passwordHashed: string): boolean {
    return compareSync(passwordAttempted, passwordHashed);
}