import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuardService } from './authguard.service';

@Injectable()
export class WebSocketService {
  private ws: WebSocket = null

  constructor(private authSvc:AuthGuardService) { }

  async CreateRoom (values) {
    const code = uuidv4().toString().substring(0, 8);
    const user = this.authSvc.getProfile()
    const payload = {
      ...values,
      code: code,
      name: user['name'] || user['username']
    }
    console.info(payload)
    const params = new HttpParams().set('payload', JSON.stringify(payload))
    console.info(params)
    this.ws = new WebSocket(`ws://localhost:3000/room?${params.toString()}`)
  }
}
