import { Component, Host, OnInit, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { create } from 'domain';
import { ApiService } from 'src/app/services/api.service';
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
  hosts:Host[] = []
  gameStarted:boolean = true

  constructor(private fb:FormBuilder, private apiSvc:ApiService, private snackbar:MatSnackBar, private activatedRoute:ActivatedRoute, private authSvc:AuthGuardService, private router:Router, private socketService:WebSocketService) { }
  ngOnInit(): void {
    this.hosts = []
    const code = this.activatedRoute.snapshot.params.code
    if (code) {
      this.creating = true
      this.joining = true
    }
  }
  
  createRoom() {
    this.message = "Creating room"
    this.creating = true
    this.createForm()
  }

  joinRoom() {
    this.message = "Joining room"
    this.joining = true
    this.apiSvc.getHosts()
    .then (data => {
      this.hosts = data
      console.info("DATA IS",this.hosts)
    })
  }

  onSubmit() {
    this.message = ""
    this.authSvc.checkToken()
    .then(bool => {
      if (bool) {
        const code = this.socketService.generateCode()
        this.form.get('code').setValue(code)
        this.socketService.setRoomDetails(this.form.value)
        this.router.navigate(['/main',code])
        this.snackbar.open("Room created!", "Close", {duration: 3000})
      } else {
        console.error("Please re-login.")
        this.authSvc.logout()
      }
    })
  }

  refresh() {
    this.apiSvc.getHosts()
    .then (data => {
      this.hosts = data
      this.snackbar.open("Rooms refreshed!", "Close", {duration: 3000})
    })
  }

  back() {
    this.message = ""
    this.creating = false
    this.joining = false
    this.hosts = []
  }

  // Generates the form
  private createForm () {
    this.form = this.fb.group({
      room: this.fb.control('New Room', [Validators.required]),
      password: this.fb.control(''),
      code: this.fb.control('')
    })
  }
}
