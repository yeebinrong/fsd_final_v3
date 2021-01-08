import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthGuardService } from './services/authguard.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'My app';
  isLogin:boolean = false;
  $isLogin:Subscription;

  constructor(private authSvc:AuthGuardService, private router:Router) {}

  ngOnInit ():void {
    this.$isLogin = this.authSvc.isLogin()
      .subscribe(bool => {
        this.isLogin = bool
        console.info("bool ", bool)
        if (!this.isLogin) {
          this.router.navigate(['/login'])
        }
      })
  }

  ngOnDestroy ():void {
    this.$isLogin.unsubscribe();
  }

  logout() {
    this.authSvc.logout()
    this.router.navigate(['/login'])
  }
}
