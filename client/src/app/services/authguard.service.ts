import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class AuthGuardService implements CanActivate {
  private token = 'a'
  private user = {}
  private $isLogin: BehaviorSubject<boolean>

  constructor(private router:Router, private http:HttpClient, private auth:AuthService) {
    if (this.token == '') {
      this.router.navigate(['/login'])
    }
    this.$isLogin = new BehaviorSubject<boolean>(!!this.token)
    const isAuth = this.auth.isAuthenticated$.subscribe((bool) => {
      if (bool) {
        const idToken = this.auth.idTokenClaims$.subscribe(data => {
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
              this.user = resp.body.user
              this.$isLogin.next(!!this.token)
              this.router.navigate(['/main'])
              isAuth.unsubscribe()
              idToken.unsubscribe()
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
    this.user = {}
    return this.http.post<any>('/api/login', credentials, {observe: 'response'}).toPromise()
    .then(resp => {
      if (resp.status == 200) {
        this.token = resp.body.token
        this.user = resp.body.user
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
    this.user = {}
    this.auth.loginWithRedirect()
  }

  logout() {
    this.token = ''
    this.user = {}
    this.$isLogin.next(!!this.token)
  }

  isLogin():Observable<boolean> {
    return this.$isLogin.asObservable()
  }

  async checkToken():Promise<boolean> {
    try {
    return await this.http.get('api/check', {headers: {Authorization:`Bearer ${this.token}`}, observe: 'response'}).toPromise()
      .then(resp => {
        if (resp.status == 200) {
          return true
        } else {
          return false
        }
      })
    }
    catch (e) {
      console.error(e.error.message)
      this.logout()
    }
  }

  getProfile() {
    return this.user
  }
}
