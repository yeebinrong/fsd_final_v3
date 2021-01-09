import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { profile } from 'console';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable()
export class AuthGuardService implements CanActivate {
  private token = ''
  private $isLogin: BehaviorSubject<boolean>

  constructor(private router:Router, private http:HttpClient, public auth:AuthService) { 
    this.$isLogin = new BehaviorSubject<boolean>(!!this.token)
    this.auth.isAuthenticated$.subscribe((bool) => {
      if (bool) {
        this.auth.idTokenClaims$.subscribe(data => {
          const payload = {
            username: data.nickname,
            email: data.email,
            avatar: data.picture,
            loginTime: data.updated_at
          }
          this.http.post<any>('/api/auth0-login', payload, {headers: {Authorization:`Bearer ${data.__raw}`}, observe: 'response'}).toPromise()
          .then(resp => {
            if (resp.status == 200) {
              this.token = resp.body.token
              this.$isLogin.next(!!this.token)
              this.router.navigate(['/main'])
            }          
          })
        })
      }
    })
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    return (!!this.token)
  }

  login(credentials):Promise<string> {
    this.token = ''
    return this.http.post<any>('/api/login', credentials, {observe: 'response'}).toPromise()
    .then(resp => {
      if (resp.status == 200) {
        this.token = resp.body.token
        this.$isLogin.next(!!this.token)
        this.router.navigate(['/main'])
      }
      return resp.body.message
    })
    .catch(e => {
      return e.error.message
    })
  }

  async auth0Login() {
    this.token = ''
    this.auth.loginWithRedirect()
  }

  logout() {
    this.token = ''
    this.$isLogin.next(!!this.token)
  }

  isLogin():Observable<boolean> {
    console.info("islogin ",this.token)
    return this.$isLogin.asObservable()
  }
}
