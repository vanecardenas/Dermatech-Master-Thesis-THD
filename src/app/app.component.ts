import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy {
  mobileQuery: MediaQueryList;

  private _mobileQueryListener: () => void;

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private auth: AngularFireAuth,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  get showMenu() {
    return (
      !this.router.url.includes('login') && !this.router.url.includes('welcome')
    );
  }

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
