import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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

  constructor(private fb:FormBuilder, private router:Router, private authSvc:AuthGuardService) { }

  ngOnInit(): void {
    this.createForm();
  }

  // Handles the form when submit button is clicked
  async onSubmit() {
    // try {
    //   this.errorMessage = ''
    //   await this.apiSvc.apiLogin(this.form.value)
    //   this.router.navigate(['/main'])
    // } catch (e) {
    //   this.errorMessage = e.error.msg;
    //   console.log("Authentication error:", e.error.msg)
    // }
    this.errorMessage = ''
    this.authSvc.login(this.form.value)
    .then (msg => {
      this.errorMessage = msg
    })
  }

/* -------------------------------------------------------------------------- */
//                    ######## PRIVATE FUNCTIONS ########
/* -------------------------------------------------------------------------- */

  // Generates the form
  private createForm () {
    this.form = this.fb.group({
      username: this.fb.control('', [Validators.required]),
      password: this.fb.control('', [Validators.required]),
    })
  }
}