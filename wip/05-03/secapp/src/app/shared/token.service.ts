import { Injectable } from '@angular/core';
// import * as appSettings from 'tns-core-modules/application-settings';
import { SecureStorage } from "nativescript-secure-storage";

const TOKEN_KEY = 'PT_TOKEN_KEY';

@Injectable()
export class TokenService {

    private secureStorage: SecureStorage;
    constructor() {
        this.secureStorage = new SecureStorage();
    }

    public get isAuthenticated(): boolean {
        return !!this.getToken();
    }

    public setToken(token: string) {
        this.secureStorage.setSync({
            key: TOKEN_KEY,
            value: token
        });
    }

    public getToken(): string {
        return this.secureStorage.getSync({
            key: TOKEN_KEY
        });
    }

    public clear(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.secureStorage.removeSync({ key: TOKEN_KEY });
            resolve();
        });
    }
}
