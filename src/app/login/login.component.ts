import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  hidePassword = true;
  email = new FormControl('', [Validators.required, Validators.email]);
  password = new FormControl('', [Validators.required]);

  constructor(
    private router: Router,
    private auth: AngularFireAuth,
    private _snackBar: MatSnackBar
  ) {}

  getEmailErrorMessage() {
    if (this.email.hasError('required')) {
      return 'Please provide an email.';
    }
    return this.email.hasError('email') ? 'Not a valid email' : '';
  }

  getPasswordErrorMessage() {
    return 'Please provide password.';
  }

  async login() {
    try {
      await this.auth.signInWithEmailAndPassword(
        this.email.value,
        this.password.value
      );
      this._snackBar.open('Successfully logged in', 'Close', {
        duration: 2000,
      });
      this.router.navigate(['/']);
    } catch (error: any) {
      let errorMessage: string;
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage =
            'The email address you entered does not match any account.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'The password is invalid.';
          break;
        default:
          errorMessage = error.message;
          break;
      }
      this._snackBar.open(errorMessage, 'Close', {
        duration: 2000,
      });
    }
  }
}
