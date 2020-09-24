import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { clients } from '../models/clients';
import { sales } from '../models/sales-water';
import { others } from '../models/sales-others';
import { BillItem } from '../models/bill-item';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  item: clients = new clients();
  itemSales: Array<sales>;
  itemPrevious: Array<sales>
  itemOthers: Array<others>;
  billItems = Array<BillItem>();
  clientId: string;
  counter: number;
  promo: number;
  slim = 0;
  round = 0;
  othersTotal = 0;
  total = 0;
  hasItem: boolean = true;
  pickupSale = new sales();

  constructor(private service: WaterService) { }

  ngOnInit(): void {
    let path = window.location.href.split('billing');
    if(path.length > 1 && path[1].length > 0) {
      this.clientId = path[1].replace("/", "");
      this.loadData();
    }
  }

  loadData() {
    this.service.db.object<clients>('clients/items/' + this.clientId).snapshotChanges().subscribe(item => {
      this.item = item.payload.val();
      this.item.key = item.key;
      this.counter = this.item.counter ?? 0;

      this.pickupSale.client_key = this.item.key;
      this.pickupSale.name = this.item.name;
      this.pickupSale.block = this.item.block;
      this.pickupSale.lot = this.item.lot;
      this.pickupSale.address = this.item.address;
      this.pickupSale.contact = this.item.contact;
      this.pickupSale.slim = this.item.slim;
      this.pickupSale.round = this.item.round;
      this.pickupSale.price = this.item.price;
      this.pickupSale.isSelected = false;
      this.pickupSale.counted = false;
      this.pickupSale.status = this.service.order_status.Pickup;
      this.pickupSale.remarks = this.item.remarks;
    });

    this.service.db.list<sales>('sales/water/items', ref => ref.orderByChild('client_key').equalTo(this.clientId)).snapshotChanges().subscribe(records => {
      this.slim = 0;
      this.round = 0;
      this.promo = 0;
      this.itemSales = new Array<sales>();
      this.itemPrevious = new Array<sales>();

      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        if(i.status == this.service.order_status.Delivery && !i.counted && i.action_day == this.service.action_day) {
          this.slim += i.slim;
          this.round += i.round;

          i.promo = 0;
          for(let x = 0; x < i.slim + i.round; x++) {
            this.counter++;

            while(this.counter > 10) {
              this.counter = this.counter - 11;
              this.promo += 1;
              i.promo += 1;
            }
          }

          if(i.promo > 0)
            i.amount = i.amount - (i.promo * i.price);
            
          this.itemSales.push(i);
        }
        else if(i.counted)
          this.itemPrevious.push(i);
      });

      this.itemPrevious = this.itemPrevious.sort((a, b) => a.action_date > b.action_date ? -1 : 1);
      if(this.itemPrevious.length > 10)
        this.itemPrevious = this.itemPrevious.slice(0, 10);

      this.compute();
    });

    this.service.db.list<others>('sales/others/items', ref => ref.orderByChild('client_key').equalTo(this.clientId)).snapshotChanges().subscribe(records => {
      this.othersTotal = 0;
      this.itemOthers = new Array<others>();
      this.billItems = new Array<BillItem>();

      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        if(i.status != this.service.order_status.Delivered && i.action_day == this.service.action_day) {
          let bill = new BillItem();
          bill.name = i.item;
          bill.quantity = i.quantity;
          bill.amount = i.amount;
          this.billItems.push(bill);
          this.itemOthers.push(i);
          this.othersTotal += i.amount;
        }
      });

      this.compute();
    });
  }

  pickup() {
    this.pickupSale.slim = this.pickupSale.slim ?? 0;
    this.pickupSale.round = this.pickupSale.round ?? 0;
    let total = (this.pickupSale.slim + this.pickupSale.round);

    if(total > 0 && this.pickupSale.slim >= 0 && this.pickupSale.round >= 0) {
      this.pickupSale.action_date = this.service.actionDate();
      this.pickupSale.action_day = this.service.action_day;
      this.pickupSale.amount = ((this.pickupSale.slim * this.pickupSale.price) + (this.pickupSale.round * this.pickupSale.price));
  
      this.service.db.list('sales/water/items').push(this.pickupSale);
  
      this.service.message = "Water sales item created.";
      this.service.router.navigateByUrl('/message');
    }
    else
      this.service.Message("Invalid amount.");
  }

  GetDate(action_day: number): Date {
    return this.service.actionDayToDate(action_day);
  }

  compute() {
    this.hasItem = (this.itemSales.length > 0 || this.billItems.length > 0);
    this.total = (((this.slim + this.round) * this.item.price) + this.othersTotal) - (this.item.price * this.promo);
  }

  delivered() {
    this.item.counter = this.counter;
    this.service.db.object('clients/items/' + this.item.key).update(this.item);

    this.itemSales.forEach(item => {
      item.status = this.service.order_status.Delivered;
      item.counted = true;
      this.service.db.object('sales/water/items/' + item.key).update(item);
    });

    this.itemOthers.forEach(item => {
      item.status = this.service.order_status.Delivered;
      this.service.db.object('sales/others/items/' + item.key).update(item);
    });
  }

  print() {
    window.print();
  }
}
