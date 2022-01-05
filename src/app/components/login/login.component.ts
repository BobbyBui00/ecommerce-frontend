import { Component, OnInit } from '@angular/core';
import { OktaAuthService } from '@okta/okta-angular';
import appConfig from 'src/app/config/app-config';
/* eslint-disable */
// @ts-ignore
import * as OktaSignIn from '@okta/okta-signin-widget';
/* eslint-enable */

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  oktaSignIn: any;

  constructor(private oktaAuthService: OktaAuthService) { 
    
    this.oktaSignIn = new OktaSignIn({
      logo: 'assets/images/logo.png',
      features: {
        registration: true,
      },
      baseUrl: appConfig.oidc.issuer.split('/oauth2')[0],
      clientId: appConfig.oidc.clientId,
      redirectUri: appConfig.oidc.redirectUri,
      authParams: {
        pkce: true, // Proof Key for Code Exchange - meaning: we gonna make use of dynamic secrets for passing the information between our app and the authorization servers
        issuer: appConfig.oidc.issuer,
        scopes: appConfig.oidc.scopes
      }
    });
  }

  ngOnInit(): void {
    this.oktaSignIn.remove();

    this.oktaSignIn.renderEl({
      el: '#okta-sign-in-widget', // render the element with the same id in html file
    },
      (response: any) => {
        if (response.status === 'SUCCESS') {
          this.oktaAuthService.signInWithRedirect();
        }
      },
      (error: any) => {
        throw error;
      }
    );
  }

}
