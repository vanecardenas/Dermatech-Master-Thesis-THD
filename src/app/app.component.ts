import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'dermatech';

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
