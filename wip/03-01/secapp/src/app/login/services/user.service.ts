import { Injectable } from "@angular/core";

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

    public register(userLogin: UserLogin) {
        return new Promise((resolve, reject) => {
            const newUser: User = {
                id: newGuid(),
                email: userLogin.email,
                password: userLogin.password
            };
            this.users.push(newUser);
            resolve();
        });
    }

    public login(userLogin: UserLogin) {
        return new Promise((resolve, reject) => {
            const foundUser = this.users.find(u => u.email === userLogin.email && u.password === userLogin.password);
            if (foundUser) {
                this.tokenService.setToken('sometokenstring');
                resolve();
            } else {
                reject();
            }
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
