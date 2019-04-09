import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';

import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptFormsModule } from "nativescript-angular/forms";

import { LoginComponent } from './login.component';
import { LoginRoutingModule } from './login.routing';
import { UserService } from './services/user.service';

@NgModule({
    imports: [
        NativeScriptModule,
        NativeScriptFormsModule,
        LoginRoutingModule
    ],
    exports: [],
    declarations: [
        LoginComponent
    ],
    providers: [
        UserService
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class LoginModule { }
