import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  code:string = ''
  constructor(private router:Router, private snackBar:MatSnackBar, private activatedRoute:ActivatedRoute, private socketService:WebSocketService) { }

  ngOnInit(): void {
    this.code = this.activatedRoute.snapshot.params.code
    if (this.code) {
      if ((/[^a-zA-Z0-9]/.test(this.code)) || this.code.length != 5) {
          this.router.navigate(['/main'])
          this.snackBar.open("Invalid Room code.", "Close", {duration: 4000})
      } else {
        this.socketService.createRoom(this.code)
        this.socketService.createGame()
      }
    }
  }
}


