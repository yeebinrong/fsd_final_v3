import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject } from 'rxjs/internal/Subject';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../model';
import { AuthGuardService } from './authguard.service';

@Injectable()
export class WebSocketService {
  private ws: WebSocket = null
  private roomDetails;
  event = new Subject<ChatMessage>()

  constructor(private authSvc:AuthGuardService, private router:Router, private snackbar:MatSnackBar) { }

  setRoomDetails (values) {
    console.info("room details are",values)
    this.roomDetails = values
  }
  getRoomDetails () {
    return this.roomDetails
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
      name:user['name'],
      username:user['username']
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
      console.info("Close due to server")
      if (this.ws != null) {
        this.snackbar.open("Failed to join the room","Close",{duration:3000})
        this.ws.close()
        this.ws = null
        this.router.navigate(['/main'])
      }
    }
  }

  leave() {
    if (this.ws != null) {
      this.snackbar.open("You left the room","Close",{duration:3000})
      this.ws.close()
      this.ws= null
    }
    this.router.navigate(['/main'])
  }

  sendMessage(payload) {
    const user = this.authSvc.getProfile()
    payload.name = user['name']
    console.info("sending message",payload)
    this.ws.send(JSON.stringify(payload))
  }
}
