import { Injectable } from "@angular/core";

import * as http from 'tns-core-modules/http';
import * as https from 'nativescript-https';

import { PtItem } from "./pt-item";
import { Config } from "~/config/config";
import { TokenService } from "../shared/token.service";

@Injectable({
    providedIn: "root"
})
export class BacklogService {

    constructor(private tokenService: TokenService) { }

    private get backlogEndpoint(): string {
        return `${Config.apiUrlHttp}/api/backlog`;
    }

    public getItems(): Promise<PtItem[]> {
        return new Promise((resolve, reject) => {
            if (!this.tokenService.isAuthenticated) {
                reject();
            }
            https.request({
                url: this.backlogEndpoint,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.tokenService.getToken()}`
                }
            })
                .then(data => {
                    console.log('data', data);
                    resolve(data.content);
                })
                .catch(error => {
                    console.error(error);
                    reject();
                });
        });
    }

    public requestLogout(): Promise<void> {
        return this.tokenService.clear()
    }

}
