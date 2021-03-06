import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { users } from '../models/users';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  display: string = 'list';
  roles: string[];
  displayedColumns: string[] = ['name', 'username', 'role', 'key'];
  item: users;
  items: Array<users>;
  showDelete: boolean = false;

  constructor(private service: WaterService) {}

  ngOnInit(): void {
    this.service.ForAdminOnly();
      
    this.roles = [this.service.user_roles.Admin, this.service.user_roles.Monitor, this.service.user_roles.Delivery, this.service.user_roles.Disabled];
    this.service.db.list<users>('users/items').snapshotChanges().subscribe(records => {
      this.items = new Array<users>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.items.push(i);
      });
    });
  }

  add() {
    this.display = 'form';
    this.item = new users();
  }

  cancel() {
    this.display = 'list';
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  edit(item: users) {
    this.display = 'form';
    this.showDelete = false;
    this.item = Object.assign({}, item);
  }

  displayDelete() {
    this.showDelete = true;
  }

  canDelete(): boolean {
    return (this.service.current_user.role == this.service.user_roles.Admin && this.item.key != null && this.item.key != '');
  }

  save() {
    let item = new users();
    item.key = this.item.key ?? "";
    item.name = this.item.name;
    item.username = this.item.username;
    item.password = this.item.password;
    item.role = this.item.role;
    item.action_date = this.service.actionDate();
    item.action_day =  this.service.action_day;

    if(item.key == null || item.key == "")
      this.service.db.list('users/items').push(item);
    else
      this.service.db.object('users/items/' + item.key).update(item);

    this.display = 'list';
  }

  delete() {
    this.service.db.object('users/items/' + this.item.key).remove();
    this.service.Message("User " + this.item.name + " deleted.");
    this.display = 'list';
  }
}
