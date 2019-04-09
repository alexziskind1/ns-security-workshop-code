import { Injectable } from '@angular/core';

// import * as appSettings from 'tns-core-modules/application-settings';

import { SecureStorage } from "nativescript-secure-storage";

const TOKEN_KEY = 'PT_TOKEN_KEY';
const EXPIRES_KEY = 'PT_EXPIRES_KEY';

@Injectable()
export class TokenService {

    private secureStorage: SecureStorage;

    constructor() {
        this.secureStorage = new SecureStorage();
    }

    public get isAuthenticated(): boolean {
        const expires = this.getExpires();
        if (!expires) {
            return false;
        }
        return new Date().getTime() < expires;
    }

    public setToken(token: string) {
        // appSettings.setString(TOKEN_KEY, token);

        this.secureStorage.setSync({
            key: TOKEN_KEY,
            value: token
        });
    }

    public getToken(): string {
        // return appSettings.getString(TOKEN_KEY);

        return this.secureStorage.getSync({
            key: TOKEN_KEY
        });
    }

    public setExpires(expires: number) {
        // appSettings.setNumber(EXPIRES_KEY, expires * 1000);
        this.secureStorage.setSync({
            key: EXPIRES_KEY,
            value: (expires * 1000).toString()
        });
    }

    public getExpires(): number {
        // return appSettings.getNumber(EXPIRES_KEY);

        return Number(this.secureStorage.getSync({
            key: EXPIRES_KEY
        }));
    }

    public clear(): Promise<void> {
        return new Promise((resolve, reject) => {
            // appSettings.remove(TOKEN_KEY);
            // appSettings.remove(EXPIRES_KEY);

            this.secureStorage.removeSync({ key: TOKEN_KEY });
            this.secureStorage.removeSync({ key: EXPIRES_KEY });

            resolve();
        });
    }
}
