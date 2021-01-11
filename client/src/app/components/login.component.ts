import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserPass } from '../model';
import { AuthGuardService } from '../services/authguard.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  // Form related variables
  form:FormGroup
  hide:boolean = true // hide password
  errorMessage = ''
  sha1 = require('sha1');

  constructor(private fb:FormBuilder, private router:Router, private authSvc:AuthGuardService) { }

  ngOnInit(): void {
    this.createForm();
  }

  // Handles the form when submit button is clicked
  onSubmit() {
    const credentials: UserPass = {
      username: this.form.get('username').value,
      password: this.sha1(this.form.get('password').value),
    }
    this.errorMessage = ''
    this.authSvc.login(credentials)
    .then (msg => {
      this.errorMessage = msg
    })
  }

  auth0Login() {
    this.authSvc.auth0Login()
  }

/* -------------------------------------------------------------------------- */
//                    ######## PRIVATE FUNCTIONS ########
/* -------------------------------------------------------------------------- */

  // Generates the form
  private createForm () {
    this.form = this.fb.group({
      username: this.fb.control('johndoe', [Validators.required]),
      password: this.fb.control('johndoe', [Validators.required]),
    })
  }
}