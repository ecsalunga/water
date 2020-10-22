import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { expenses } from '../models/expenses';
import { ExpensesCategory } from '../models/expenses-category';
import { ExpensesItem } from '../models/expenses-item';
import { Command } from '../models/command';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {
  IsAllowed: boolean = false;
  IsOpenDaysShowed: boolean = false;
  role: string = "";
  selected: number;
  selectedDate = new Date();
  display: string = 'list';
  displayedColumns: string[] = ['name', 'amount', 'key'];
  item = new expenses();
  items: Array<expenses>;
  categories: Array<ExpensesCategory>;
  openDays: Array<number>;
  showDelete: boolean = false;

  nameControl = new FormControl();
  nameFilteredOptions: Observable<string[]>;
  nameOptions: string[] = [];

  constructor(private service: WaterService) { }

  ngOnInit(): void {
    this.item.category = "Others";
    this.role = this.service.current_user.role;
    this.selected = this.service.action_day;
    this.loadData();
    this.loadCommonSettingsData();
    this.service.Changed.subscribe((cmd: Command) => {
      if(cmd.type == this.service.command_types.ImageUploaded)
        this.item.imagePath = cmd.data;
      else if(cmd.type == this.service.command_types.Loader && cmd.data == 'settings-common')
        this.loadCommonSettingsData();
    });
  }

  private loadCommonSettingsData() {
    this.setLocked();
    this.loadOpenDays();
  }

  GetDate(action_day: number): Date {
    return this.service.actionDayToDate(action_day);
  }

  SetDate() {
    this.loadData();
    this.loadCommonSettingsData();
  }

  private loadOpenDays() {
    this.openDays = this.service.GetOpenDays();
    this.IsOpenDaysShowed = this.service.IsShowOpenDays();
  }

  setLocked() {
    this.IsAllowed = this.service.IsAllowed(this.selected);
  }

  loadData() {
    this.service.db.list<expenses>('expenses/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      this.items = new Array<expenses>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.items.push(i);
      });
    });
  }

  dateSelected() {
    this.selected = this.service.getActionDay(this.selectedDate);
    this.loadData();
  }

  add() {
    this.setCommon();
    this.item = new expenses();
    this.item.imagePath = this.service.defaultImagePath;
    this.item.action_date = this.service.actionDate();
    this.item.category = "Others";
  }

  cancel() {
    this.display = 'list';
  }

  edit(item: expenses) {
    this.setCommon();
    this.item = Object.assign({}, item);
    this.showDelete = false;
  }

  displayDelete() {
    this.showDelete = true;
  }

  canDelete(): boolean {
    return (this.item.key != null && this.item.key != '');
  }

  delete() {
    this.service.db.object('expenses/items/' + this.item.key).remove();
    this.service.Message(this.item.name + " deleted.");
    this.display = 'list';
  }

  private setCommon() {
    this.display = 'form';
    this.categories = this.service.expenses_categories;
    this.setNameOptions();
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  save() {
    let item = new expenses();
    item.key = this.item.key ?? "";
    item.name = this.item.name;
    item.category = this.item.category;
    item.amount = this.item.amount;
    item.remarks = this.item.remarks ?? "";
    item.imagePath = this.item.imagePath;
    item.action_day = this.selected;
    item.action_date = this.item.action_date;

    if (item.key == null || item.key == "")
      this.service.db.list('expenses/items').push(item);
    else
      this.service.db.object('expenses/items/' + item.key).update(item);

    this.saveItem();
    this.display = 'list';
  }

  private saveItem() {
    let isExists = false;
    this.service.expenses_items.forEach(item => {
      if (item.name.toLowerCase() == this.item.name.toLowerCase() && item.category.toLowerCase() == this.item.category.toLowerCase())
        isExists = true;
    });

    if(!isExists) {
      let item = new ExpensesItem();
      item.name = this.item.name;
      item.category = this.item.category;
      item.group = this.service.setting_types.ExpensesItem;
      item.action_date = this.service.actionDate();
      item.action_day =  this.service.action_day;
      this.service.db.list('settings/items').push(item);
    }
  }

  upload() {
    if(this.IsAllowed) {
      this.service.imagePath = "/images/expenses/" + this.item.action_date + ".png";
      this.service.selectImage();
    }
  }

  updateAuto() {
    this.setNameOptions();
  }

  private setNameOptions() {
    this.nameOptions = [];
    this.service.expenses_items.forEach(item => {
      if(this.item.category != null)
      {
        if(item.category == this.item.category)
          this.nameOptions.push(item.name);
      }
      else
        this.nameOptions.push(item.name);
    });

    this.nameOptions = this.nameOptions.sort((a, b) => a > b ? 1 : -1);
    this.nameFilteredOptions = this.nameControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterName(value))
    );
  }

  private _filterName(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.nameOptions.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }
}
