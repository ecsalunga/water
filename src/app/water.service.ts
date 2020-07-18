import { Injectable, ElementRef, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import { ExpensesCategory } from './models/expenses-category';
import { ExpensesItem } from './models/expenses-item';
import { users } from './models/users';
import { Access } from './models/access';
import { Command } from './models/command';
import { SettingsCommon } from './models/settings-common';
import { SalesOthersItem } from './models/sales-others-item';

@Injectable({
  providedIn: 'root'
})
export class WaterService {
  Changed: EventEmitter<Command> = new EventEmitter();

  defaultImagePath: string = 'https://firebasestorage.googleapis.com/v0/b/acqua-perfetta.appspot.com/o/images%2Fdefault_default_photo.png?alt=media&token=6a1124f4-58d9-45cd-b134-024c71c6e898';
  imagePath: string = '';
  imageSelector: ElementRef;

  expenses_categories: Array<ExpensesCategory>;
  expenses_items: Array<ExpensesItem>;
  other_sales_items: Array<SalesOthersItem>;
  settings_common: SettingsCommon = new SettingsCommon();

  app_users: Array<users>;
  action_day: number;
  order_status = { Preparing: 'preparing', Delivery: 'delivery', Delivered: "delivered", Cancelled: "cancelled" };
  user_roles = { Admin: 'Admin', Monitor: 'Monitor', Delivery: "Delivery" };
  user_access: Access;
  current_user = { name: '', username: '', role: '', isLogin: false };
  setting_types = { ExpensesCategory: 'expenses-category', ExpensesItem: 'expenses-item', OtherSalesItems: 'other-sales-item' };
  command_types = { ImageUploaded: 'image-uploaded', Progress: 'progress' };
  
  constructor(public db: AngularFireDatabase, public store: AngularFireStorage, public router: Router) {
    this.action_day =  this.actionDay();
    this.loadSettingsCommon();
    this.loadUsers();
    this.loadSettings();
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

  private loadSettings() {
    this.db.list<ExpensesCategory>('settings/items', ref => ref.orderByChild('group').equalTo(this.setting_types.ExpensesCategory)).snapshotChanges().subscribe(records => {
      this.expenses_categories = new Array<ExpensesCategory>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.expenses_categories.push(i);
      });
    });

    this.db.list<ExpensesItem>('settings/items', ref => ref.orderByChild('group').equalTo(this.setting_types.ExpensesItem)).snapshotChanges().subscribe(records => {
      this.expenses_items = new Array<ExpensesItem>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.expenses_items.push(i);
      });
    });

    this.db.list<SalesOthersItem>('settings/items', ref => ref.orderByChild('group').equalTo(this.setting_types.OtherSalesItems)).snapshotChanges().subscribe(records => {
      this.other_sales_items = new Array<SalesOthersItem>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.other_sales_items.push(i);
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

  private loadSettingsCommon() {
    this.db.object<SettingsCommon>('/settings/common').snapshotChanges().subscribe(item => {
      this.settings_common = item.payload.val();
    });
  }

  public SaveSettingsCommon() {
    this.db.object('/settings/common').set(this.settings_common);
  }

  public saveLogin() {
    localStorage.setItem('name', this.current_user.name);
    localStorage.setItem('username', this.current_user.username);
    localStorage.setItem('role', this.current_user.role);
  }

  public loadAccess() {
    this.user_access =  new Access();
    this.user_access.WaterSalesEdit = true;
    // temp
    if(this.current_user.role == this.user_roles.Delivery) {
      this.user_access.WaterSalesEdit = false;
    }
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
      this.loadAccess();
    }
  }

  public logOut() {
    localStorage.setItem('name', '');
    localStorage.setItem('username', '');
    localStorage.setItem('role', '');
    this.current_user = { name: '', username: '', role: '', isLogin: false };
    this.router.navigateByUrl('/login');
  }

  selectImage() {
    this.imageSelector.nativeElement.click();
  }

  upload() {
    if(this.imagePath == '')
      return;

    let nativeElement = (<HTMLInputElement>this.imageSelector.nativeElement);
    let selectedFile = nativeElement.files[0];
    if(selectedFile.type.indexOf("image") > -1) {
      let cmd = new Command();
      cmd.type = this.command_types.Progress;
      cmd.data = 1;
      this.Changed.emit(cmd);

      let task = this.store.upload(this.imagePath, selectedFile);

      task.snapshotChanges().subscribe(item => {
        if(item.bytesTransferred == item.totalBytes) {
          item.ref.getDownloadURL().then(path => {
            cmd = new Command();
            cmd.type = this.command_types.Progress;
            cmd.data = 100;
            this.Changed.emit(cmd);

            cmd = new Command();
            cmd.type = this.command_types.ImageUploaded;
            cmd.data = path;
            this.Changed.emit(cmd);
          });

          this.imagePath = '';
          nativeElement.value = "";
        }
        else {
          let cmd = new Command();
          cmd.type = this.command_types.Progress;
          cmd.data = (item.bytesTransferred/item.totalBytes) * 100;
          this.Changed.emit(cmd);
        }
      });
    }
    else {
      nativeElement.value = "";
      console.log('Invalid image.');
    }
  }
}
