import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  constructor(private service: WaterService) {}

  ngOnInit(): void {
    if(!this.service.current_user.isLogin)
      this.service.router.navigateByUrl('/login');
  }

}
