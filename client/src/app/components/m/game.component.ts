import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthGuardService } from 'src/app/services/authguard.service';
import { WebSocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  form:FormGroup
  creating:boolean
  joining:boolean
  hide:boolean
  message:string

  constructor(private fb:FormBuilder, private authSvc:AuthGuardService, private socketService:WebSocketService) { }

  ngOnInit(): void {
  }
  
  createRoom() {
    this.message = "Creating room"
    this.creating = true
    this.createForm()
  }

  joinRoom() {
    this.message = "Joining room"
    this.joining = true
    this.createForm()    
  }

  onSubmit() {
    this.message = ""
    this.creating = false
    this.joining = false
    this.authSvc.checkToken()
    .then(bool => {
      if (bool) {
        this.socketService.CreateRoom(this.form.value)
      } else {
        console.error("Please re-login.")
        this.authSvc.logout()
      }
    })
  }

  refresh() {

  }

  back() {
    this.message = ""
    this.creating = false
    this.joining = false
  }

  // Generates the form
  private createForm () {
    this.form = this.fb.group({
      room: this.fb.control('', [Validators.required]),
      password: this.fb.control(''),
    })
  }
}
