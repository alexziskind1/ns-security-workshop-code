import { Injectable } from '@angular/core';

@Injectable()
export class TokenService {

    private token: string = null;

    public get isAuthenticated(): boolean {
        return !!this.token;
    }

    public setToken(token: string) {
        this.token = token;
    }

    public getToken(): string {
        return this.token;
    }

    public clear(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.token = null;
            resolve();
        });
    }
}
