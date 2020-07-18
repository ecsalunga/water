import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { others } from '../models/sales-others';
import { clients } from '../models/clients';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-sales-others',
  templateUrl: './sales-others.component.html',
  styleUrls: ['./sales-others.component.scss']
})
export class SalesOthersComponent implements OnInit {
  role: string = "";
  selected: number;
  selectedDate = new Date();
  display: string = 'list';
  displayedColumns: string[] = ['name', 'item', 'amount', 'key'];
  item: others;
  itemClients: Array<clients>;
  items: Array<others>;

  blockControl = new FormControl();
  blockFilteredOptions: Observable<string[]>;
  blockOptions: string[] = ['Block'];

  lotControl = new FormControl();
  lotFilteredOptions: Observable<string[]>;
  lotOptions: string[] = ['Lot'];

  nameControl = new FormControl();
  nameFilteredOptions: Observable<string[]>;
  nameOptions: string[] = [];

  addressControl = new FormControl();
  addressFilteredOptions: Observable<string[]>;
  addressOptions: string[] = [];

  constructor(private service: WaterService) { }

  ngOnInit(): void {
    this.role = this.service.current_user.role;
    this.selected = this.service.action_day;
    this.loadData();
    this.loadClientData();
  }

  loadData() {
    this.service.db.list<others>('sales/others/items', ref => ref.orderByChild('action_day').equalTo(this.selected)).snapshotChanges().subscribe(records => {
      this.items = new Array<others>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.items.push(i);
      });
    });
  }

  loadClientData() {
    this.service.db.list<clients>('clients/items').snapshotChanges().subscribe(records => {
      this.itemClients = new Array<clients>();
      records.forEach(item => {
        let i = item.payload.val();
        i.key = item.key;
        this.itemClients.push(i);
      });

      this.setNameOptions();
      this.setBlockOptions();
      this.setAddressOptions();
    });
  }

  dateSelected() {
    this.selected = this.service.getActionDay(this.selectedDate);
    this.loadData();
  }

  add() {
    this.display = 'form';
    this.item = new others();
  }

  cancel() {
    this.display = 'list';
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  edit(item: others) {
    this.display = 'form';
    this.item = Object.assign({}, item);
  }

  save() {
    let item = new others();
    item.key = this.item.key ?? "";
    item.name = this.item.name ?? "";
    item.block = this.item.block ?? "";
    item.lot = this.item.lot ?? "";
    item.address = this.item.address ?? "";
    item.contact = this.item.contact ?? "";
    item.item = this.item.item;
    item.quantity = this.item.quantity;
    item.amount = this.item.amount;
    item.remarks = this.item.remarks ?? "";
    item.action_date = this.service.actionDate();
    item.action_day = this.selected;

    if (item.key == null || item.key == "")
      this.service.db.list('sales/others/items').push(item);
    else
      this.service.db.object('sales/others/items/' + item.key).update(item);

    this.saveClient();
    this.display = 'list';
  }

  private saveClient() {
    let isExists = false;
    this.itemClients.forEach(item => {
      if (item.name.toLowerCase() == this.item.name.toLowerCase() && item.address.toLowerCase() == this.item.address.toLowerCase())
        isExists = true;
    });

    if(!isExists) {
      let item = new clients();
      item.key = "";
      item.name = this.item.name;
      item.block = this.item.block ?? "";
      item.lot = this.item.lot ?? "";
      item.address = this.item.address;
      item.name = this.item.address ?? "";
      item.contact = this.item.contact ?? "";
      item.remarks = this.item.remarks ?? "";
      item.action_date = this.service.actionDate();
      item.action_day = this.service.action_day;
      item.last_order = item.action_date;
      this.service.db.list('clients/items').push(item);
    }
  }

  private setBlockOptions() {
    this.blockOptions = [];
    this.itemClients.forEach(item => {
      if (this.blockOptions.indexOf(item.block) == -1)
        this.blockOptions.push(item.block);
    });

    this.blockOptions = this.blockOptions.sort((a, b) => a > b ? 1 : -1);
    this.blockFilteredOptions = this.blockControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterBlock(value))
    );
  }

  private _filterBlock(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.blockOptions.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  updateLotOptions() {
    this.setLotOptions();
    this.blockLotUpdate();
  }

  blockLotUpdate() {
    this.itemClients.forEach(item => {
      if (item.block == this.item.block && item.lot == this.item.lot)
      {
        this.item.name = item.name;
        this.item.address = item.address;
        this.updateCommon(item);
      }
    });
  }

  updateName() {
    this.itemClients.forEach(item => {
      if (item.name.toLowerCase() == this.item.name.toLowerCase())
      {
        this.item.block = item.block;
        this.item.lot = item.lot;
        this.item.address = item.address;
        this.updateCommon(item);
      }
    });
  }

  updateAddress() {
    this.itemClients.forEach(item => {
      if (item.address.toLowerCase() == this.item.address.toLowerCase())
      {
        this.item.name = item.name;
        this.item.block = item.block;
        this.item.lot = item.lot;
        this.updateCommon(item);
      }
    });
  }

  private updateCommon(item: clients) {
    this.item.contact = item.contact;
    this.item.remarks = item.remarks;
  }

  private setLotOptions() {
    this.lotOptions = ['Lot'];
    this.itemClients.forEach(item => {
      if (item.block == this.item.block) {
        if (this.lotOptions.indexOf(item.lot) == -1)
          this.lotOptions.push(item.lot);
      }
    });

    this.lotOptions = this.lotOptions.sort((a, b) => a > b ? 1 : -1);
    this.lotFilteredOptions = this.lotControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterLot(value))
    );
  }

  private _filterLot(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.lotOptions.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  private setNameOptions() {
    this.nameOptions = [];
    this.itemClients.forEach(item => {
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

  private setAddressOptions() {
    this.addressOptions = [];
    this.itemClients.forEach(item => {
      this.addressOptions.push(item.address);
    });

    this.addressOptions = this.addressOptions.sort((a, b) => a > b ? 1 : -1);
    this.addressFilteredOptions = this.addressControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterAddress(value))
    );
  }

  private _filterAddress(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.addressOptions.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }
}
