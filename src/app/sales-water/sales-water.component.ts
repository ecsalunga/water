import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { sales } from '../models/sales-water';
import { arrayify } from 'tslint/lib/utils';

@Component({
  selector: 'app-sales-water',
  templateUrl: './sales-water.component.html',
  styleUrls: ['./sales-water.component.scss']
})
export class SalesWaterComponent implements OnInit {
  display: string = 'list';
  displayedColumns: string[] = ['address', 'contact', 'round', 'slim', 'amount'];
  item: sales;
  items: Array<sales>;

  constructor(private db: AngularFireDatabase) { }

  ngOnInit(): void {
    this.db.list<sales>('sales/water/items').snapshotChanges().subscribe(records => {
      this.items = new Array<sales>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.items.push(i);
      });
    });
  }

  add() {
    this.display = 'form';
    this.item = new sales();
  }

  cancel() {
    this.display = 'list';
  }

  save() {
    let item = new sales();
    item.address = this.item.address;
    item.contact = this.item.contact;
    item.amount = this.item.amount;
    item.round = this.item.round;
    item.slim = this.item.slim;
    item.action_date = 20200713073201;

    this.db.list('sales/water/items').push(item);
    this.display = 'list';
  }
}
