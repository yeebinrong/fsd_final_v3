import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../model';
import { AuthGuardService } from './authguard.service';

@Injectable()
export class WebSocketService {
  private ws: WebSocket = null
  private roomDetails;
  event = new Subject<ChatMessage>()

  constructor(private authSvc:AuthGuardService, private router:Router) { }

  setRoomDetails (values) {
    console.info("room details are",values)
    this.roomDetails = values
  }

  generateCode () {
    return uuidv4().toString().substring(0, 5);
  }

  async joinRoom (code) {
    console.info("JOINING",code)
  }
  
  async createRoom (code) {
    if (!this.roomDetails || this.roomDetails.code != code) {
      this.roomDetails = {
        room:'New Room',
        password:'',
        code:code
      }
    }
    const user = this.authSvc.getProfile()
    const payload = {
      // room
      // password
      // code
      ...this.roomDetails,
      name: user['name'] || user['username']
    }
    console.info(payload)
    const params = new HttpParams().set('payload', JSON.stringify(payload))
    console.info(params)
    this.ws = new WebSocket(`ws://localhost:3000/room?${params.toString()}`)

    // handle incoming message
    this.ws.onmessage = (payload: MessageEvent) => {
      // parse the string to chatmessage
      const chat = JSON.parse(payload.data) as ChatMessage
      console.info("incoming from server",payload.data)
      this.event.next(chat)
    }

    // handle errors
    this.ws.onclose = () => {
      if (this.ws != null) {
        console.info("Closing socket due to server error/closure.")
        this.ws.close()
        this.ws = null
      }
    }
  }

  leave() {
    if (this.ws != null) {
      console.info("closing socket due to user leaving")
      this.ws.close()
      this.ws= null
    }
  }

  sendMessage(message) {
    console.info("sending message")
    this.ws.send(message)
  }
}
