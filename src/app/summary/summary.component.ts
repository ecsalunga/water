import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';

import { others } from '../models/sales-others';
import { sales } from '../models/sales-water';
import { expenses } from '../models/expenses';
import { Command } from '../models/command';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {
  IsLockDisplayed: boolean = false;
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
    this.setIsLockDisplayed();
    if(this.service.settings_common == null) {
      this.service.Changed.subscribe((cmd: Command) => {
        if(cmd.type == this.service.command_types.Loader && cmd.data == 'settings-common') {
          this.setLock();
          this.setIsLockDisplayed();
        }
      });
    }
  }

  dateSelected() {
    this.selected = this.service.getActionDay(this.selectedDate);
    this.loadData();
    this.setLock();
  }

  toggleLock() {
    let isLocked = this.service.ToggleLock(this.selected);
    this.date_locked = (isLocked ? 'lock' : 'lock_open');
    
    if(this.role == this.service.user_roles.Monitor)
      this.IsLockDisplayed = !this.service.IsLocked(this.selected);
  }

  setIsLockDisplayed() {
    this.IsLockDisplayed = false;
    if(this.role == this.service.user_roles.Admin)
      this.IsLockDisplayed = true;
    else if(this.role == this.service.user_roles.Monitor)
      this.IsLockDisplayed = !this.service.IsLocked(this.selected);
  }

  setLock() {
    let isLocked = this.service.IsLocked(this.selected);
    this.date_locked = (isLocked ? 'lock' : 'lock_open');
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
