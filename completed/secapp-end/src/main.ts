import { platformNativeScriptDynamic } from "nativescript-angular/platform";

import { AppModule } from "./app/app.module";
import { knownFolders } from 'tns-core-modules/file-system';
import * as https from 'nativescript-https';

/*
const certsDir = knownFolders.currentApp().getFolder('certs');
const certPath = certsDir.getFile('localhost.cer').path;

https.enableSSLPinning({
    allowInvalidCertificates: true,
    certificate: certPath,
    validatesDomainName: false,
    host: 'https://localhost:8443'
});
*/

platformNativeScriptDynamic().bootstrapModule(AppModule);
