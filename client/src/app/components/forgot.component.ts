import { sha1 } from '@angular/compiler/src/i18n/digest';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthGuardService } from '../services/authguard.service';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.css']
})
export class ForgotComponent implements OnInit {
  // Form related variables
  form:FormGroup
  form2:FormGroup
  hide:boolean = true // hide password
  token:string = ''
  sha1 = require('sha1');
  valid = false
  constructor(private fb:FormBuilder, private router:Router, private snackbar:MatSnackBar, private authSvc:AuthGuardService, private apiSvc:ApiService, private activatedRoute:ActivatedRoute) { }

  ngOnInit(): void {
    this.createForm();
    this.createForm2()
    this.token = this.activatedRoute.snapshot.params.code
    if (!!this.token) {
      this.token = this.token.split('-').join('.')
      this.authSvc.verifyToken(this.token)
      .then (bool => {
          this.valid = bool
          if (!bool) {
          // token is invalid / expired
          this.token = ''
          this.router.navigate(['/reset'])
        }
      })
    }
  }

  // Handles the form when submit button is clicked
  async onSubmit() {
    this.apiSvc.resetPassword(this.form.value)
    .then(bool => {
      if (bool) {
        this.snackbar.open("Reset link has been sent to your email. Please check your inbox.","Close", {duration:3000})
        this.router.navigate(['/login'])
      }
    }).catch(e => {
      this.snackbar.open("Username / email not found.","Close", {duration:3000})
      console.error(e.error.message)
      this.router.navigate(['/login'])
    })
  }

  updatePassword() {
    // updates password
    const payload = {
      password:this.sha1(this.form2.get('password').value),
      token:this.token
    }
    this.apiSvc.updatePassword(payload)
    .then ((bool) => {
      if (bool) {
        this.snackbar.open("Password updated successfully.","Close", {duration:3000})
        this.router.navigate(['/login'])
      }
    }).catch(e => {
      this.snackbar.open("Failed to update password.","Close", {duration:3000})
      console.error(e.error.message)
      this.router.navigate(['/login'])
    })
  }

/* -------------------------------------------------------------------------- */
//                    ######## PRIVATE FUNCTIONS ########
/* -------------------------------------------------------------------------- */

  // Generates the form
  private createForm () {
    this.form = this.fb.group({
      username: this.fb.control('', [Validators.required]),
      email: this.fb.control('', [Validators.required, Validators.pattern(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)]),
    })
  }

  private createForm2 () {
    this.form2 = this.fb.group({
      password: this.fb.control('', [Validators.required]),
      confirm: this.fb.control('', [Validators.required]),
    })
  }
}
