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
