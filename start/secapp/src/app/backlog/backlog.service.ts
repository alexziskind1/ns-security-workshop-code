import { Injectable } from "@angular/core";

import * as http from 'tns-core-modules/http';

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
            http.request({
                url: this.backlogEndpoint,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.tokenService.getToken()}`
                }
            })
                .then(res => res.content)
                .then(content => content.toJSON())
                .then(data => resolve(data))
                .catch(error => {
                    console.error(error);
                    reject();
                });
        });
    }
}
