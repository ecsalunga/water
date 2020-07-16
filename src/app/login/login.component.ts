import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  error: string = '';
  

  constructor(private service: WaterService) {}

  ngOnInit(): void {
  }

  login() {
    if(this.username != '' && this.password != '') {
      this.service.app_users.forEach(item => {
        if(item.username.toLowerCase() == this.username.toLowerCase() && item.password == this.password) {
          this.service.current_user.username = item.username;
          this.service.current_user.role = item.role;
          this.service.current_user.isLogin = true;

          localStorage.setItem('username', this.service.current_user.username);
          localStorage.setItem('role', this.service.current_user.role);
        }
      });

      if(this.service.current_user.isLogin)
        this.service.router.navigateByUrl('/menu');
      else
        this.error = "Invalid information";
    }
  }
}