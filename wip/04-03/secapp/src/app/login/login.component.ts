import { Component, ElementRef, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { alert, prompt } from "tns-core-modules/ui/dialogs";
import { Page } from "tns-core-modules/ui/page";
import { UserLogin } from "./models/user-login.model";
import { UserService } from "./services/user.service";


@Component({
    selector: "app-login",
    moduleId: module.id,
    templateUrl: "./login.component.html",
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    public isLoggingIn = true;
    public userLogin: UserLogin;

    @ViewChild("password") password: ElementRef;
    @ViewChild("confirmPassword") confirmPassword: ElementRef;

    constructor(private page: Page,
        private userService: UserService,
        private router: Router
    ) {
        this.page.actionBarHidden = true;
        this.userLogin = {
            email: 'alex@nuvious.com',
            password: 'password',
            confirmPassword: 'password'
        };
    }

    public toggleForm() {
        this.isLoggingIn = !this.isLoggingIn;
    }

    public submit() {
        if (!this.userLogin.email || !this.userLogin.password) {
            this.alert("Please provide both an email address and password.");
            return;
        }

        if (this.isLoggingIn) {
            this.login();
        } else {
            this.register();
        }
    }

    private login() {
        this.userService.login(this.userLogin)
            .then(() => {
                //Redirect to secure route
                this.router.navigate(["/items"]);
            })
            .catch(() => {
                this.alert("Unfortunately we could not find your account.");
            });
    }

    private register() {
        if (this.userLogin.password != this.userLogin.confirmPassword) {
            this.alert("Your passwords do not match.");
            return;
        }
        this.userService.register(this.userLogin)
            .then(() => {
                this.alert("Your account was successfully created.");
                this.isLoggingIn = true;
            })
            .catch(() => {
                this.alert("Unfortunately we were unable to create your account.");
            });
    }

    public forgotPassword() {
        prompt({
            title: "Forgot Password",
            message: "Enter the email address you used to register for APP NAME to reset your password.",
            inputType: "email",
            defaultText: "",
            okButtonText: "Ok",
            cancelButtonText: "Cancel"
        }).then((data) => {
            if (data.result) {
                this.userService.resetPassword(data.text.trim())
                    .then(() => {
                        this.alert("Your password was successfully reset. Please check your email for instructions on choosing a new password.");
                    }).catch(() => {
                        this.alert("Unfortunately, an error occurred resetting your password.");
                    });
            }
        });
    }

    public focusPassword() {
        this.password.nativeElement.focus();
    }

    public focusConfirmPassword() {
        if (!this.isLoggingIn) {
            this.confirmPassword.nativeElement.focus();
        }
    }

    private alert(message: string) {
        return alert({
            title: "APP NAME",
            okButtonText: "OK",
            message: message
        });
    }
}

