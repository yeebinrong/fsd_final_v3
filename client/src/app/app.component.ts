import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
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
    this.myLoad()
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

  // detect if user close the tab or goes to a different url
  @HostListener('window:unload', [ '$event' ])
  unloadHandler(event) {
    this.myUnload()
    console.info("leaving")
  }

  myUnload() {
    if (window.localStorage) {
        // flag the page as being unloading
        window.localStorage['myUnloadEventFlag']=new Date().getTime();
    }
    // notify the server that we want to disconnect the user in a few seconds (I used 5 seconds)
    // askServerToDisconnectUserInAFewSeconds(); // synchronous AJAX call
    this.authSvc.startUnload()
  }
  myLoad() {
    if (window.localStorage) {
        var t0 = Number(window.localStorage['myUnloadEventFlag']);
        if (isNaN(t0)) t0=0;
        var t1=new Date().getTime();
        var duration=t1-t0;
        if (duration<10*1000) {
            // less than 10 seconds since the previous Unload event => it's a browser reload (so cancel the disconnection request)
            this.authSvc.stopUnload(); // asynchronous AJAX call
        } else {
            // last unload event was for a tab/window close => do whatever you want (I do nothing here)
            this.authSvc.logout()
        }
    }
} 
}
