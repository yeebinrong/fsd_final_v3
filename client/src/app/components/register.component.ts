import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UserEmailPass } from '../model';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  // Form related variables
  form:FormGroup
  hide:boolean = true // hide password
  errorMessage = ''
  sha1 = require('sha1');

  constructor(private fb:FormBuilder, private router:Router, private apiSvc:ApiService, private _snackBar:MatSnackBar) { }

  ngOnInit(): void {
    this.createForm();
  }

  // Handles the form when submit button is clicked
  async onSubmit() {
    const credentials: UserEmailPass = {
      username: this.form.get('username').value,
      email: this.form.get('email').value,
      password: this.sha1(this.form.get('password').value),
    }
    this.errorMessage = ''
    this.apiSvc.createAccount(credentials)
    .then (result => {
      // send email to user verify account?
      this._snackBar.open(result.message, "Close", {
        duration: 4000
      })
      this.router.navigate(['/login'])
    })
    .catch (e => {
      this.errorMessage = e.error.message
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
      password: this.fb.control('', [Validators.required]),
    })
  }
}