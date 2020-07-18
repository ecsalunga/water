import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { ExpensesCategory } from '../models/expenses-category';
import { ExpensesItem } from '../models/expenses-item';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  displayedExpensesCategoryColumns: string[] = ['name'];
  displayedExpensesItemColumns: string[] = ['name'];

  categoryName: string = "";
  itemsExpensesCategory: Array<ExpensesCategory>;

  expensesItem: ExpensesItem = new ExpensesItem();
  itemsExpensesItems: Array<ExpensesItem>;

  constructor(private service: WaterService) {}

  ngOnInit(): void {
    if(this.service.current_user.role != this.service.user_roles.Admin)
      this.service.router.navigateByUrl('/menu');

    this.service.db.list<ExpensesCategory>('settings/items', ref => ref.orderByChild('group').equalTo(this.service.setting_types.ExpensesCategory)).snapshotChanges().subscribe(records => {
      this.itemsExpensesCategory = new Array<ExpensesCategory>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.itemsExpensesCategory.push(i);
      });
    });

    this.service.db.list<ExpensesItem>('settings/items', ref => ref.orderByChild('group').equalTo(this.service.setting_types.ExpensesItem)).snapshotChanges().subscribe(records => {
      this.itemsExpensesItems = new Array<ExpensesItem>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.itemsExpensesItems.push(i);
      });
    });
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  addExpenseCategory() {
    let item = new ExpensesCategory();
    item.name = this.categoryName;
    item.group = this.service.setting_types.ExpensesCategory;
    item.action_date = this.service.actionDate();
    item.action_day =  this.service.action_day;
    this.service.db.list('settings/items').push(item);
    this.categoryName = "";
  }

  addExpenseItem() {
    let item = new ExpensesItem();
    item.name = this.expensesItem.name;
    item.group = this.service.setting_types.ExpensesItem;
    item.action_date = this.service.actionDate();
    item.action_day =  this.service.action_day;
    this.service.db.list('settings/items').push(item);
    this.expensesItem = new ExpensesItem();
  }
}
