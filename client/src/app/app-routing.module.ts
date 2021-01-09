import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ForgotComponent } from './components/forgot.component';
import { LoginComponent } from './components/login.component';
import { MainComponent } from './components/main.component';
import { RegisterComponent } from './components/register.component';
import { AuthGuardService } from './services/authguard.service';

const routes: Routes = [
  {path:'login', component:LoginComponent},
  {path:'register', component:RegisterComponent},
  {path:'forgot', component:ForgotComponent},
  {path:'main', component:MainComponent, canActivate: [AuthGuardService]},
  // {path:'main', component:MainComponent},
  {path:'**', redirectTo:'login', pathMatch:'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
