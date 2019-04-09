import { Injectable } from '@angular/core';
import * as appSettings from 'tns-core-modules/application-settings';

const TOKEN_KEY = 'PT_TOKEN_KEY';

@Injectable()
export class TokenService {

    private token: string = null;

    public get isAuthenticated(): boolean {
        return !!this.getToken();
    }

    public setToken(token: string) {
        appSettings.setString(TOKEN_KEY, token);
    }
    public getToken(): string {
        return appSettings.getString(TOKEN_KEY);
    }

    public clear(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.token = null;
            resolve();
        });
    }
}
