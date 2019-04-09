import { Injectable } from "@angular/core";

import * as http from 'tns-core-modules/http';
import * as https from 'nativescript-https';

import { UserLogin } from "../models/user-login.model";
import { Config } from "~/config/config";

import { TokenService } from "~/app/shared/token.service";
import { User } from "../models/user.model";
import { newGuid } from "~/app/util/guid";

@Injectable()
export class UserService {

    private users: User[] = [];

    constructor(private tokenService: TokenService) { }

    private get loginEndpoint(): string {
        return `${Config.apiUrlHttp}/api/login`;
    }

    private get registerEndpoint(): string {
        return `${Config.apiUrlHttp}/api/register`;
    }

    public get isLoggedIn() {
        return this.tokenService.isAuthenticated;
    }

    public register(userLogin: UserLogin) {
        return new Promise((resolve, reject) => {
            https.request({
                url: this.registerEndpoint,
                method: 'POST',
                headers: {},
                body: { ...userLogin }
            })
                .then(res => {
                    resolve(res);
                })
                .catch(error => {
                    this.handleErrors(error);
                    reject();
                });
        });
    }

    public login(userLogin: UserLogin) {
        return new Promise((resolve, reject) => {
            https.request({
                url: this.loginEndpoint,
                method: 'POST',
                headers: {},
                body: { ...userLogin }
            })
                .then(res => {
                    this.tokenService.setToken(res.content.access_token);
                    this.tokenService.setExpires(res.content.expires);
                    resolve();
                })
                .catch(error => {
                    this.handleErrors(error);
                    reject();
                });
        });
    }

    public logout(): Promise<void> {
        return Promise.resolve();
    }

    public resetPassword(email: string) {
        return new Promise((resolve, reject) => {
            // Add your own reset logic
        });
    }

    handleErrors(error: Error) {
        console.error(error.message);
    }
}
