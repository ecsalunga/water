import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { category } from '../models/category';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  displayedColumns: string[] = ['name'];
  categoryName: string = "";
  items: Array<category>;

  constructor(private service: WaterService) {}

  ngOnInit(): void {
    this.service.db.list<category>('settings/items', ref => ref.orderByChild('group').equalTo('expenses')).snapshotChanges().subscribe(records => {
      this.items = new Array<category>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.items.push(i);
      });
    });
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  add() {
    let item = new category();
    item.name = this.categoryName;
    item.group = "expenses";
    item.action_date = this.service.actionDate();
    item.action_day =  this.service.Action_Day;
    this.service.db.list('settings/items').push(item);
    this.categoryName = "";
  }
}
