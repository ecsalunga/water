import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireDatabase } from '@angular/fire/database';
import { category } from './models/category';
import { users } from './models/users';

@Injectable({
  providedIn: 'root'
})
export class WaterService {
  expenses_categories: Array<category>;
  app_users: Array<users>;
  action_day: number;
  order_status = { New: 'new', Delivery: 'delivery', Delivered: "delivered", Cancelled: "cancelled" };
  user_roles = { Admin: 'Admin', Manager: 'Manager', Staff: "Staff" };
  current_user = { name: '', username: '', role: '', isLogin: false };
  
  constructor(public db: AngularFireDatabase, public router: Router) {
    this.action_day =  this.actionDay();
    this.loadUsers();
    this.loadExpensesCategory();
  }

  public actionDate(): number {
    let date: Date = new Date();
    return this.getActionDate(date);
  }

  public actionDay(): number {
    let date: Date = new Date();
    return this.getActionDay(date);
  }

  public getActionDate(date: Date): number {
    let strDate = date.getFullYear() + this.az(date.getMonth() + 1) + this.az(date.getDate()) + this.az(date.getHours()) + this.az(date.getMinutes()) + this.az(date.getSeconds());
    return parseInt(strDate);
  }

  public getActionDay(date: Date): number {
    let strDate = date.getFullYear() + this.az(date.getMonth() + 1) + this.az(date.getDate());
    return parseInt(strDate);
  }

  public actionDateToDate(num: number): Date {
    let val = num.toString();
    let year = parseInt(val.substring(0, 4));
    let month = parseInt(val.substring(4, 6));
    let day = parseInt(val.substring(6, 8));
    let hour = parseInt(val.substring(8, 10));
    let minute = parseInt(val.substring(10, 12));
    let second = parseInt(val.substring(12, 14));

    return new Date(year, month - 1, day, hour, minute, second);
  }

  public actionDayToDate(keyDay: number): Date {
    return this.actionDateToDate(parseInt(keyDay + '000000'));
  }

  private az(val: number): string {
    let num = val.toString();
    if (num.length < 2)
      num = "0" + num;

    return num;
  }

  private loadExpensesCategory() {
    this.db.list<category>('settings/items', ref => ref.orderByChild('group').equalTo('expenses')).snapshotChanges().subscribe(records => {
      this.expenses_categories = new Array<category>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.expenses_categories.push(i);
      });
    });
  }

  private loadUsers() {
    this.db.list<users>('users/items').snapshotChanges().subscribe(records => {
      this.app_users = new Array<users>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.app_users.push(i);
      });
    });
  }

  public saveLogin() {
    localStorage.setItem('name', this.current_user.name);
    localStorage.setItem('username', this.current_user.username);
    localStorage.setItem('role', this.current_user.role);
  }

  public getLogin() {
    let name = localStorage.getItem('name');
    let username = localStorage.getItem('username');
    let role = localStorage.getItem('role');

    if(username != null && username != '') {
      this.current_user.name = name;
      this.current_user.username = username;
      this.current_user.role = role;
      this.current_user.isLogin = true;
    }
  }

  public logOut() {
    localStorage.setItem('name', '');
    localStorage.setItem('username', '');
    localStorage.setItem('role', '');
    this.current_user = { name: '', username: '', role: '', isLogin: false };
    this.router.navigateByUrl('/login');
  }
}
