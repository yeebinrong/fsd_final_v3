import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  constructor(private auth:AuthService) { }

  ngOnInit(): void {
    this.auth.user$.toPromise()
    .then(result => {
      console.info(result)
    })
  }

}
