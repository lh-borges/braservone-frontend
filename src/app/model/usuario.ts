import { Empresa } from "./empresa";

export class Usuario {
  constructor(
    public nome: string,
    public token: string,
    public type: string,
    public username: string,
    public email: string,
    public empresa: Empresa,
    public roles: string[],
    public accessToken: string,
    public tokenType: string
  ) {}
}