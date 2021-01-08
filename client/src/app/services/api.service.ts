import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class ApiService {

  constructor(private http:HttpClient) { }

  createAccount(values):Promise<any> {
    return this.http.post('/api/register', values).toPromise()
  }
}
