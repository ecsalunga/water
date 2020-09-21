import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { ExpensesCategory } from '../models/expenses-category';
import { ExpensesItem } from '../models/expenses-item';
import { SalesOthersItem } from '../models/sales-others-item';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  displayedExpensesCategoryColumns: string[] = ['name', 'key'];
  displayedExpensesItemColumns: string[] = ['name', 'key'];
  displayedOtherSalesItemsColumns: string[] = ['name', 'price', 'key'];

  categoryName: string = "";
  itemsExpensesCategory: Array<ExpensesCategory>;

  expensesItem: ExpensesItem = new ExpensesItem();
  itemsExpensesItems: Array<ExpensesItem>;

  otherSalesItem: SalesOthersItem = new SalesOthersItem();
  itemsOtherSalesItems: Array<SalesOthersItem>

  constructor(private service: WaterService) {}

  ngOnInit(): void {
    this.service.ForAdminOnly();
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

    this.service.db.list<SalesOthersItem>('settings/items', ref => ref.orderByChild('group').equalTo(this.service.setting_types.OtherSalesItems)).snapshotChanges().subscribe(records => {
      this.itemsOtherSalesItems = new Array<SalesOthersItem>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.itemsOtherSalesItems.push(i);
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

  addOtherSalesItem() {
    let item = new SalesOthersItem();
    item.name = this.otherSalesItem.name;
    item.price = this.otherSalesItem.price;
    item.group = this.service.setting_types.OtherSalesItems;
    item.action_date = this.service.actionDate();
    item.action_day =  this.service.action_day;
    this.service.db.list('settings/items').push(item);
    this.otherSalesItem = new SalesOthersItem();
  }

  deleteCategory(item: ExpensesCategory) {
    this.service.db.object('settings/items/' + item.key).remove();
  }

  deleteItem(item: ExpensesItem) {
    this.service.db.object('settings/items/' + item.key).remove();
  }

  deleteOtherSalesItem(item: SalesOthersItem) {
    this.service.db.object('settings/items/' + item.key).remove();
  }

  isOtherItemDisabled(): boolean {
    let isDisabled = false;
    if(this.otherSalesItem.name == null || this.otherSalesItem.name == '')
      isDisabled = true;
    else if(this.otherSalesItem.price == null || this.otherSalesItem.price < 1)
      isDisabled = true;

    return isDisabled;
  }

  resetTesPlusOne() {
    this.service.clients.forEach(client => {
      client.counter = 0;
      this.service.db.object('clients/items/' + client.key).update(client);
    });

    this.service.Message("Reset submitted.");
  }
}
