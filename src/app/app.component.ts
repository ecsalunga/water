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
    if(!this.service.current_user.isLogin)
      this.service.getLogin();

    if(!this.service.current_user.isLogin)
      this.service.router.navigateByUrl('/login');
  }

  logout() {
    this.service.logOut();
  }

  showLogout() {
    return this.service.current_user.isLogin;
  }
}
