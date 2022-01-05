import { Component, OnInit } from '@angular/core';
import { OktaAuthService } from '@okta/okta-angular';

@Component({
  selector: 'app-login-status',
  templateUrl: './login-status.component.html',
  styleUrls: ['./login-status.component.css']
})
export class LoginStatusComponent implements OnInit {

  isAuthenticated?: boolean;
  userFullname?: string;

  storage: Storage = sessionStorage;

  constructor(private oktaAuthService: OktaAuthService) { }

  ngOnInit(): void {

    // Subscribe to authentication state changes
    this.oktaAuthService.$authenticationState.subscribe(
      (result) => {
        this.isAuthenticated = result;
        this.getUserDetails();
      }
    )

  }

  getUserDetails() {
    if(this.isAuthenticated) {
      
      // fetch the logged in user details (user's claim)
      // user full name is exposed as a property name
      this.oktaAuthService.getUser().then(
        (res) => {
          this.userFullname = res.name;

          // retrieve the user's email from authentication response
          const theEmail = res.email;

          // store the email in the browser
          this.storage.setItem("userEmail", JSON.stringify(theEmail));
        }
      );
    }
  }

  logout() {
    // Terminates the session with Okta and removes the current tokens
    this.oktaAuthService.signOut();
  }

}
