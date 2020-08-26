import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { Menu } from '../models/menu';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  role: string = "";
  menu = Menu;
  constructor(private service: WaterService) {}

  ngOnInit(): void {
    if(!this.service.current_user.isLogin)
      this.service.router.navigateByUrl('/login');
    else
      this.role = this.service.current_user.role;
  }

  navigate(menu: any) {
    this.service.router.navigateByUrl(menu.path);
  }

  isVisible(menu: any): boolean {
    if(menu.roles == "all")
      return true;
    
    return (menu.roles.indexOf(this.service.current_user.role) > -1);
  }
}
