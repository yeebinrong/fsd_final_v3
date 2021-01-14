import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Game } from 'phaser';
import { Subject } from 'rxjs/internal/Subject';
import { v4 as uuidv4 } from 'uuid';
import { MainScene } from '../components/scenes/main.scene';
import { RequestMovementMessage, MSG_TYPE_REQUEST_MOVEMENT, GetAllPlayerLocationsMessage, MSG_TYPE_GET_ALL_PLAYER_LOCATIONS, GetPlayerLocationMessage, MSG_TYPE_GET_PLAYER_LOCATION, BaseMessage } from '../messages';
import { AuthGuardService } from './authguard.service';

@Injectable()
export class WebSocketService {
  private ws: WebSocket = null
  private roomDetails;
  private player = null
  created = false
	game: Game
  event = new Subject<BaseMessage>()

  constructor(private authSvc:AuthGuardService, private router:Router, private snackbar:MatSnackBar) { }

  createGame() {
		if (this.created)
			return
    console.info("created")
		this.game = new Game({
      // width: 64 * 10, height: 64 * 10,
      width: 272, height: 208,
			parent: 'game',
      type: Phaser.AUTO,
      zoom: 2.5,
      scene: [ MainScene ],
      physics: {
        default: 'arcade',
        arcade: {
          // debug:true
        }
      }
		})
	}

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
      const chat = JSON.parse(payload.data) as BaseMessage
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
    payload.type = 'chatting'
    console.info("sending message",payload)
    this.ws.send(JSON.stringify(payload))
  }

  movePlayer(key) {
    const msg: RequestMovementMessage = {
      type: MSG_TYPE_REQUEST_MOVEMENT,
      player: this.player,
      key: key,
      ...this.roomDetails,

    }
    this.ws.send(JSON.stringify(msg))
  }

  getAllPlayerLocations() {
    const msg: GetAllPlayerLocationsMessage = {
      type: MSG_TYPE_GET_ALL_PLAYER_LOCATIONS,
      player: this.player
    }
    this.ws.send(JSON.stringify(msg))
  }

  getPlayerLocation() {
    // construct message
    const msg: GetPlayerLocationMessage = {
      type: MSG_TYPE_GET_PLAYER_LOCATION,
      player: this.player
    }
    this.ws.send(JSON.stringify(msg))
  }

  setPlayer(id) {
    this.player = id
  }
  getPlayer():number {
    return this.player
  }
}
