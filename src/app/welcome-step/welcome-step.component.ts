import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome-step',
  templateUrl: './welcome-step.component.html',
  styleUrls: ['./welcome-step.component.scss'],
})
export class WelcomeStepComponent {
  constructor(
    private auth: AngularFireAuth,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {}

  async logout() {
    try {
      await this.auth.signOut();
      this._snackBar.open('Successfully logged out', 'Close', {
        duration: 2000,
      });
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.log(error.message);
      this._snackBar.open('There was an error logging you out', 'Close', {
        duration: 2000,
      });
    }
  }
}
