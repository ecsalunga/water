import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';

import { others } from '../models/sales-others';
import { sales } from '../models/sales-water';
import { expenses } from '../models/expenses';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {
  date_locked: string = 'lock';
  role: string = "";
  selected: number;
  selectedDate = new Date();
  summary = { expenses: 0, water: 0, others: 0, diff: 0 };

  constructor(private service: WaterService) { }

  ngOnInit(): void {
    this.role = this.service.current_user.role;
    this.selected = this.service.action_day;
    this.loadData();
    this.setLock();
  }

  dateSelected() {
    this.selected = this.service.getActionDay(this.selectedDate);
    this.loadData();
    this.setLock();
  }

  toggleLock() {
    if(this.date_locked == 'lock') {
      if(this.service.settings_common.Unlocked == null)
        this.service.settings_common.Unlocked = new Array<number>();

      this.service.settings_common.Unlocked.push(this.selected);
      if(this.selected == this.service.action_day)
        this.service.settings_common.Locked = 0;

      this.service.SaveSettingsCommon();
      this.date_locked = 'lock_open';
    }
    else {
      let items = new Array<number>();
      if(this.service.settings_common.Unlocked != null) {
        this.service.settings_common.Unlocked.forEach(item => {
          if(item != this.selected)
            items.push(item);
        });
      }

      this.service.settings_common.Unlocked = items;
      if(this.selected == this.service.action_day)
        this.service.settings_common.Locked = this.selected;

      this.service.SaveSettingsCommon();
      this.date_locked = 'lock';
    }
  }

  setLock() {
    this.date_locked = 'lock';
    if(this.service.action_day == this.selected && this.service.settings_common.Locked != this.selected)
      this.date_locked = 'lock_open';
    else if(this.service.settings_common.Unlocked != null && this.service.settings_common.Unlocked.length > 0) {
      this.service.settings_common.Unlocked.forEach(item => {
        if(this.selected == item)
          this.date_locked = 'lock_open';
      });
    }
  }

  loadData() {
    this.service.db.list<sales>('sales/water/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      this.summary.water = 0;
      
      records.forEach(item => {
        let i = item.payload.val();
        if(i.status == this.service.order_status.Delivered)
          this.summary.water += i.amount;
      });

      this.computeDiff();
    });

    this.service.db.list<others>('sales/others/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      this.summary.others = 0;

      records.forEach(item => {
        let i = item.payload.val();
        this.summary.others += i.amount;
      });

      this.computeDiff();
    });

    this.service.db.list<expenses>('expenses/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      this.summary.expenses = 0;

      records.forEach(item => {
        let i = item.payload.val();
        this.summary.expenses += i.amount;
      });

      this.computeDiff();
    });
  }

  computeDiff() {
    this.summary.diff = (this.summary.water + this.summary.others) - this.summary.expenses;
  }
}
