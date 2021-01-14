import { BrowserModule } from '@angular/platform-browser';
import { Injector, NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';

import { AuthModule } from '@auth0/auth0-angular';

import { LoginComponent } from './components/login.component';
import { MainComponent } from './components/main.component';
import { AuthGuardService } from './services/authguard.service';
import { WebSocketService } from './services/websocket.service';
import { RegisterComponent } from './components/register.component';
import { ForgotComponent } from './components/forgot.component';
import { ApiService } from './services/api.service';
import { ProfileComponent } from './components/m/profile.component';
import { GameComponent } from './components/m/game.component';
import { ChatComponent } from './components/m/chat.component';
import { Globals } from './model';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainComponent,
    RegisterComponent,
    ForgotComponent,
    ProfileComponent,
    GameComponent,
    ChatComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    HttpClientModule,
    AuthModule.forRoot({
      domain:'binrong.us.auth0.com',
      clientId:'JSiQsFmldMnJizNk3s2Q796mwcoE40Vv'
    })
  ],
  providers: [AuthGuardService, WebSocketService, ApiService],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(injector: Injector) {
		Globals.injector = injector
	}
}
