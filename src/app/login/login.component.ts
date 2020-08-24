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
          this.service.current_user.key = item.key;
          this.service.current_user.name = item.name;
          this.service.current_user.username = item.username;
          this.service.current_user.role = item.role;
          this.service.current_user.isLogin = true;
          this.service.saveLogin();
          this.service.loadAccess();
        }
      });

      if(this.service.current_user.isLogin) {
        let requestPath = this.service.getRequestPath();
        if(requestPath == null || requestPath.toLowerCase().indexOf('login') > -1)
          this.service.router.navigateByUrl('/menu');
        else
          window.location.href = requestPath;
      }
      else
        this.error = "Invalid information";
    }
  }
}
