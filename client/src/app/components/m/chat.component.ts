import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BaseMessage } from 'src/app/messages';
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
  messages:BaseMessage[] = []
  roomDetails = {}

  constructor(private fb:FormBuilder, private socketService:WebSocketService) { }

  ngOnInit(): void {
    this.createForm()
    this.event$ = this.socketService.event.subscribe(chat => {
      if (!chat.type) {
        this.messages.unshift(chat)
      }
    })
    this.roomDetails = this.socketService.getRoomDetails()
  }

  onSubmit() {
    const payload = {
      message: this.form.get('message').value,
      name: ''
    }
    this.socketService.sendMessage(payload)
    this.form.reset()
  }

  leaveRoom() {
    this.socketService.leave()
  }

  // Generates the form
  private createForm () {
    this.form = this.fb.group({
      message: this.fb.control('', [Validators.required]),
      name: this.fb.control('')
    })
  }
}
