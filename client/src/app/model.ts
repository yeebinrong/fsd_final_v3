import { Injector } from "@angular/core";

export interface UserEmailPass {
    username: string,
    email: string,
    password: string
} 

export interface UserPass {
    username: string,
    password: string
}

export interface UserProfile {
    name: string,
    email: string,
    avatar: string
}

export interface ChatMessage {
    from: string,
    message: string,
    ts: string
}

export interface Host {
    room: string,
    password: string,
    code: string,
    name: string
}

export class Globals {
	static injector: Injector
}
