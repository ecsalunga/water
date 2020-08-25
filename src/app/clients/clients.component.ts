import { Component, OnInit } from '@angular/core';
import { NgxQrcodeElementTypes, NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';
import { WaterService } from '../water.service';
import { clients } from '../models/clients';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  elementType = NgxQrcodeElementTypes.URL;
  correctionLevel = NgxQrcodeErrorCorrectionLevels.HIGH;
  display: string = 'none';
  displayedColumns: string[] = ['name', 'address', 'contact', 'key'];
  item: clients;
  items: Array<clients>;
  currentURL: string;
  clientPath: string;
  
  constructor(private service: WaterService) { }

  ngOnInit(): void {
    let path = window.location.href.split('clients');
    this.currentURL = path[0];
    this.service.NotForDelivery();
    this.display = 'list';
    this.loadData();
  }

  updateAddress() {
    let block = this.item.block ?? "";
    let lot = this.item.lot ?? "";
    let address = (block != "") ? block + ", " + lot : lot;
    this.item.address = address;
  }

  loadData() {
    this.service.db.list<clients>('clients/items', ref => ref.orderByChild('name')).snapshotChanges().subscribe(records => {
      this.items = new Array<clients>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.items.push(i);
      });
    });
  }

  add() {
    this.display = 'form';
    this.item = new clients();
    this.clientPath = "";
  }

  cancel() {
    this.display = 'list';
  }

  cardBuilder() {
    this.service.router.navigateByUrl('/card');
  }

  edit(item: clients) {
    this.display = 'form';
    this.item = Object.assign({}, item);
    this.clientPath = this.currentURL + "billing/" + item.key;
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  save() {
    let item = new clients();
    item.key = this.item.key ?? "";
    item.name = this.item.name ?? "";
    item.block = this.item.block;
    item.lot = this.item.lot;
    item.address = this.item.address ?? "";
    item.contact = this.item.contact ?? "";
    item.remarks = this.item.remarks ?? "";
    item.slim = this.item.slim ?? 0;
    item.round = this.item.round ?? 0;
    item.price = this.item.price ?? 0;
    item.counter = this.item.counter ?? 0;
    item.action_date = this.service.actionDate();
    item.action_day = this.service.action_day;

    if (item.key == null || item.key == "") {
      item.last_order = item.action_date;
      this.service.db.list('clients/items').push(item);
    }
    else
      this.service.db.object('clients/items/' + item.key).update(item);

    this.display = 'list';
  }
}
