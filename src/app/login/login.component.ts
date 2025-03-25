import { Component, OnInit } from '@angular/core';
import { LoginService} from '../../../auth/service/login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent implements OnInit {
  ngOnInit(): void {
    console.log('./login.component.css')
  }

}
