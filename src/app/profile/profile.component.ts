import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { users } from '../models/users';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  passwordCurrent = "";
  passwordNew = "";
  passwordConfirm = "";
  item = new users();
  constructor(private service: WaterService) {}

  ngOnInit(): void {
    this.service.app_users.forEach(user => {
      if(user.key == this.service.current_user.key)
       this.item = Object.assign({}, user);;
    });
  }

  update() {
    if(this.item.password != this.passwordCurrent)
      this.service.Message("Current password do not match.");
    else if(this.passwordNew.length < 1)
      this.service.Message("Password too small.");
    else if(this.passwordNew != this.passwordConfirm)
      this.service.Message("Confirm password do not match.");
    else {
      this.item.password = this.passwordNew;
      this.service.db.object('users/items/' + this.item.key).update(this.item);
      this.service.Message("Password updated.");
      this.service.router.navigateByUrl('/menu');
    }
  }
}
