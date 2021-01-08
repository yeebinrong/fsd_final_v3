import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthGuardService } from '../services/authguard.service';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.css']
})
export class ForgotComponent implements OnInit {
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
      email: this.fb.control('', [Validators.required, Validators.pattern(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)]),
    })
  }
}
