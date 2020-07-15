import { Component, OnInit } from '@angular/core';
import { WaterService } from './water.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private service: WaterService) {}

  ngOnInit(): void {
    if(!this.service.current_user.isLogin) {
      let username = localStorage.getItem('username');
      let role = localStorage.getItem('role');

      if(username != null && username != '') {
        this.service.current_user.username = username;
        this.service.current_user.role = role;
        this.service.current_user.isLogin = true;
      }
    }

    if(!this.service.current_user.isLogin)
      this.service.router.navigateByUrl('/login');
  }

  logout() {
    localStorage.setItem('username', '');
    localStorage.setItem('role', '');
    this.service.current_user.username = '';
    this.service.current_user.role = '';
    this.service.current_user.isLogin = false;
    this.service.router.navigateByUrl('/login');
  }

  showLogout() {
    return this.service.current_user.isLogin;
  }
}
