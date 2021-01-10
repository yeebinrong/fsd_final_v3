import { Component, OnInit } from '@angular/core';
import { UserProfile } from 'src/app/model';
import { AuthGuardService } from 'src/app/services/authguard.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user:UserProfile
  constructor(private authSvc:AuthGuardService) { }

  ngOnInit(): void {
    this.user = this.authSvc.getProfile() as UserProfile
    console.info("user is", this.user)
    // if (!this.user.avatar)
  }

}
