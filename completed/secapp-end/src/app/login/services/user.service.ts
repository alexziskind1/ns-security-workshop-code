import { Injectable } from "@angular/core";

import * as http from 'tns-core-modules/http';
import * as https from 'nativescript-https';

import { UserLogin } from "../models/user-login.model";
import { Config } from "~/config/config";

import { TokenService } from "~/app/shared/token.service";

@Injectable()
export class UserService {

    constructor(private tokenService: TokenService) { }

    private get loginEndpoint(): string {
        if (Config.useSSL) {
            return `${Config.apiUrlHttps}/api/login`;
        } else {
            return `${Config.apiUrlHttp}/api/login`;
        }
    }

    private get registerEndpoint(): string {
        if (Config.useSSL) {
            return `${Config.apiUrlHttps}/api/register`;
        } else {
            return `${Config.apiUrlHttp}/api/register`;
        }
    }

    public register(userLogin: UserLogin) {
        if (Config.useSSL) {
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
        } else {
            return new Promise((resolve, reject) => {
                http.request({
                    url: this.registerEndpoint,
                    method: 'POST',
                    headers: {},
                    content: JSON.stringify(userLogin)
                })
                    .then(res => res.content)
                    .then(content => content.toJSON())
                    .then(data => resolve(data))
                    .catch(error => {
                        this.handleErrors(error);
                        reject();
                    });
            });
        }
    }

    public login(userLogin: UserLogin) {
        if (Config.useSSL) {
            return new Promise((resolve, reject) => {
                https.request({
                    url: this.loginEndpoint,
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                    },
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
        } else {
            return new Promise((resolve, reject) => {
                http.request({
                    url: this.loginEndpoint,
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                    },
                    content: JSON.stringify(userLogin)
                })
                    .then(res => res.content)
                    .then(content => content.toJSON())
                    .then(data => {
                        console.log('data: ', data);
                        this.tokenService.setToken(data.access_token);
                        this.tokenService.setExpires(data.expires);
                        resolve(data);
                    })
                    .catch(error => {
                        this.handleErrors(error);
                        reject();
                    });
            });
        }
    }

    public logout(): Promise<void> {
        return this.tokenService.clear();
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
