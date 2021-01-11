import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthGuardService } from './services/authguard.service';
import { WebSocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'My app';
  isLogin:boolean = false;
  $isLogin:Subscription;

  constructor(private authSvc:AuthGuardService, private router:Router, private socketService:WebSocketService) {}

  ngOnInit ():void {
    this.$isLogin = this.authSvc.isLogin()
      .subscribe(bool => {
        this.isLogin = bool
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
    this.socketService.leave()
    this.router.navigate(['/login'])
  }
}
