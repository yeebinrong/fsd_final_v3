import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class AuthGuardService implements CanActivate {
  private token = ''
  private user = {}
  private $isLogin: BehaviorSubject<boolean>

  constructor(private router:Router, private http:HttpClient, private auth:AuthService, private snackbar:MatSnackBar) {
    this.token = sessionStorage.getItem('token')
    this.user = JSON.parse(sessionStorage.getItem('user'))
    const path = window.location.pathname.split('/')
    if (this.token == '' || this.token == null) {
      if (!(path[1] == 'reset')) {
        this.router.navigate(['/login'])
      }
    } else if(!!path[3]) {
      this.router.navigate(['/main'])
    }
    this.$isLogin = new BehaviorSubject<boolean>(!!this.token)
    const isAuth = this.auth.isAuthenticated$.subscribe((bool) => {
      if (bool) {
        const idToken = this.auth.idTokenClaims$.subscribe(data => {
          console.info(data)
          const payload = {
            username: data.sub,
            name: data.nickname,
            email: data.email,
          }
          this.http.post<any>('/api/auth0-login', payload, {headers: {Authorization:`Bearer ${data.__raw}`}, observe: 'response'}).toPromise()
          .then(resp => {
            if (resp.status == 200) {
              this.setToken(resp)
              isAuth.unsubscribe()
              idToken.unsubscribe()
            }          
          })
          .catch(e => {
            snackbar.open("Login Error", "Close", {duration:3000})
            console.error(e.error.message)
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
        this.setToken(resp)
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

  startUnload() {
    if (this.user && this.user != undefined) {
      this.http.get(`/api/user/startunload/${this.user['name']}`).toPromise()
    }
  }

  stopUnload() {
    if (this.user && this.user != undefined) {
      this.http.get(`/api/user/stopunload/${this.user['name']}`).toPromise()
    }
  }

  logout() {
    this.http.post('/api/logout', this.user).toPromise()
    this.token = ''
    sessionStorage.removeItem('token')
    this.user = {}
    sessionStorage.removeItem('user')
    this.$isLogin.next(!!this.token)
    this.snackbar.open("Logout successful!", "close", {duration:2000})
  }

  isLogin():Observable<boolean> {
    return this.$isLogin.asObservable()
  }

  setToken (resp) {
    this.token = resp.body.token
    sessionStorage.setItem('token', this.token)
    this.user = resp.body.user
    sessionStorage.setItem('user', JSON.stringify(this.user))
    this.$isLogin.next(!!this.token)
    this.router.navigate(['/main'])
    this.snackbar.open("Login successful!", "close", {duration:2000})
  }

  setUser(user) {
    this.user = user
    sessionStorage.setItem('user', JSON.stringify(this.user))
  }

  async checkToken():Promise<boolean> {
    try {
    return await this.http.get('api/check', {headers: {Authorization:`Bearer ${this.token}`}, observe: 'response'}).toPromise()
      .then(resp => {
        return (resp.status == 200) 
      })
    }
    catch (e) {
      console.error(e.error.message)
      this.logout()
    }
  }

  async verifyToken(token):Promise<boolean> {
    return await this.http.get('api/check', {headers: {Authorization:`Bearer ${token}`}, observe: 'response'}).toPromise()
    .then (resp => {
      return (resp.status == 200)
    })
    .catch (e => {
      console.error(e.error.message)
      return false 
    })
  }

  getProfile() {
    return this.user
  }
}
