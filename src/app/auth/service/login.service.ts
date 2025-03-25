import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../state/auth.state';
import { selectBaseUrl } from '../state/app.selector'; 

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  baseURL$: Observable<string>;

  constructor(private http: HttpClient, private store: Store<AppState>) {
    // Selecionando baseURL do store
    this.baseURL$ = this.store.select(selectBaseUrl); // Aqui é um Observable
    console.log('root')
    console.log(this.baseURL$);
  }

  login(Login: string, Senha: string): void {
   
    this.baseURL$.subscribe((baseURL) => {
      const url = `${baseURL}/auth/login`; // Construir a URL com o baseURL
      this.http.post(url, { Login, Senha }).subscribe(
        (resultado) => console.log(resultado),
        (erro) => console.error(erro)
      );
    });
  }
}
