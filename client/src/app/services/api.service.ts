import { HttpClient } from '@angular/common/http';
import { Host, Injectable } from '@angular/core';

@Injectable()
export class ApiService {

  constructor(private http:HttpClient) { }

  createAccount(values):Promise<any> {
    return this.http.post('/api/register', values).toPromise()
  }

  getHosts() {
    return this.http.get<any>('/api/rooms').toPromise()
    .then(data => {
      let array = []
      for (let i in data['rooms']) {
        array.push(data['rooms'][i])
      }
      return array 
    })
  }
}
