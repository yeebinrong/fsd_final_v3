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

export interface Character {
	name: string
	id: number
}

export const CHARACTERS: Character[] = [
	{ name: 'Knight', id: 0 },
	{ name: 'Amazon', id: 1 },
	{ name: 'Joker', id: 2 },
	{ name: 'Griffin', id: 3 },
]

export const ID_TO_IMG = [ 118, 120, 124 , 134 ]