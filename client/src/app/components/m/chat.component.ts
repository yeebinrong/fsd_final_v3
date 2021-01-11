import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatMessage } from 'src/app/model';
import { WebSocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  form:FormGroup
  event$:Subscription
  messages:ChatMessage[] = []
  roomDetails = {}

  constructor(private fb:FormBuilder, private socketService:WebSocketService) { }

  ngOnInit(): void {
    this.createForm()
    this.event$ = this.socketService.event.subscribe(chat => {
      this.messages.push(chat)
    })
    this.roomDetails = this.socketService.getRoomDetails()
  }

  onSubmit() {
    const message = this.form.get('message').value
    this.socketService.sendMessage(message)
    this.form.reset()
  }

  leaveRoom() {
    this.socketService.leave()
  }

  // Generates the form
  private createForm () {
    this.form = this.fb.group({
      message: this.fb.control(''),
    })
  }
}
