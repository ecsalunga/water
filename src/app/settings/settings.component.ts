import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { ExpensesCategory } from '../models/expenses-category';
import { ExpensesItem } from '../models/expenses-item';
import { SalesOthersItem } from '../models/sales-others-item';
import { Command } from '../models/command';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  displayedExpensesCategoryColumns: string[] = ['name', 'key'];
  displayedExpensesItemColumns: string[] = ['name', 'category', 'key'];
  displayedOtherSalesItemsColumns: string[] = ['name', 'price', 'key'];

  categoryName: string = "";
  itemsExpensesCategory = new Array<ExpensesCategory>();

  expensesItem: ExpensesItem = new ExpensesItem();
  itemsExpensesItems: Array<ExpensesItem>;

  otherSalesItem: SalesOthersItem = new SalesOthersItem();
  itemsOtherSalesItems: Array<SalesOthersItem>

  showSensitive = false;
  selectedCategory: string = "Others";

  constructor(private service: WaterService) {}

  ngOnInit(): void {
    this.service.ForAdminOnly();
    this.itemsExpensesCategory = this.service.expenses_categories;
    this.itemsExpensesItems = this.service.expenses_items;
    this.itemsOtherSalesItems = this.service.other_sales_items;

    this.service.Changed.subscribe((cmd: Command) => {
      if (cmd.type == this.service.command_types.Loader && cmd.data == 'expenses_categories')
        this.itemsExpensesCategory = this.service.expenses_categories;
      else if (cmd.type == this.service.command_types.Loader && cmd.data == 'expenses_items')
        this.itemsExpensesItems = this.service.expenses_items;
      else if (cmd.type == this.service.command_types.Loader && cmd.data == 'other_sales_items')
        this.itemsOtherSalesItems = this.service.other_sales_items;
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

    this.service.cache.expenses_categories = this.service.actionDate();
    this.service.saveCacheReferrence();
  }

  addExpenseItem() {
    let item = new ExpensesItem();
    item.name = this.expensesItem.name;
    item.category = this.selectedCategory;
    item.group = this.service.setting_types.ExpensesItem;
    item.action_date = this.service.actionDate();
    item.action_day =  this.service.action_day;
    this.service.db.list('settings/items').push(item);
    this.expensesItem = new ExpensesItem();

    this.service.cache.expenses_items = this.service.actionDate();
    this.service.saveCacheReferrence();
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

    this.service.cache.other_sales_items = this.service.actionDate();
    this.service.saveCacheReferrence();
  }

  deleteCategory(item: ExpensesCategory) {
    this.service.db.object('settings/items/' + item.key).remove();

    this.service.cache.expenses_categories = this.service.actionDate();
    this.service.saveCacheReferrence();
  }

  deleteItem(item: ExpensesItem) {
    this.service.db.object('settings/items/' + item.key).remove();

    this.service.cache.expenses_items = this.service.actionDate();
    this.service.saveCacheReferrence();
  }

  deleteOtherSalesItem(item: SalesOthersItem) {
    this.service.db.object('settings/items/' + item.key).remove();

    this.service.cache.other_sales_items = this.service.actionDate();
    this.service.saveCacheReferrence();
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

    this.service.Message("Reset 10+1 submitted.");
  }

  resetSlimRoundPrice() {
    this.service.clients.forEach(client => {
      client.slim = 0;
      client.round = 0;
      client.price = 0;
      this.service.db.object('clients/items/' + client.key).update(client);
    });

    this.service.Message("Reset slim, round and price submitted.");
  }

  displayResets() {
    this.showSensitive = true;
  }
}
