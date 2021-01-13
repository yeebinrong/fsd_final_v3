import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserProfile } from 'src/app/model';
import { ApiService } from 'src/app/services/api.service';
import { AuthGuardService } from 'src/app/services/authguard.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  form:FormGroup
  user:UserProfile
  isEditProfile:boolean = false;
  imageSrc;

  constructor(private authSvc:AuthGuardService, private apiSvc:ApiService, private fb:FormBuilder, private snackbar:MatSnackBar) { }

  ngOnInit(): void {
    this.user = this.authSvc.getProfile() as UserProfile
    this.createForm()
  }

  onEditProfile() {
    this.isEditProfile = !this.isEditProfile
    if (this.isEditProfile) {
      this.createForm()
    }
  }
  
  onSubmit() {
    this.authSvc.checkToken()
    .then(bool => {
      if (bool) {
        // save profile name
        const payload = {
          ...this.user,
          updated: this.form.get('name').value,
        }
        this.apiSvc.updateName(payload)
        .then (data => {
          console.info(data)
          this.authSvc.setUser(data.user[0])
          this.user = data.user[0]
          this.snackbar.open("Profile saved!", "Close", {duration:3000})
          this.isEditProfile = false
          this.form.reset()
        })
      }
    })
  }

  readURL(event: Event): void {
    if (event.target['files'] && event.target['files'][0]) {
        const file = event.target['files'][0];

        const reader = new FileReader();
        reader.onload = e => this.imageSrc = reader.result;

        reader.readAsDataURL(file);
    }
}

  // Generates the form
  private createForm () {
    this.form = this.fb.group({
      name: this.fb.control((this.user['name']), [Validators.required]),
      image_file: this.fb.control('')
    })
  }
}
