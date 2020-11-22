import { Component, OnInit } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { WaterService } from '../water.service';
import { clients } from '../models/clients';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  display: string = 'none';
  displayedColumns: string[] = ['name', 'address', 'contact', 'key'];
  dataSource = new Array<clients>();
  item: clients;
  currentURL: string;
  filter: string = '';
  showDelete: boolean = false;

  constructor(public service: WaterService) { }

  ngOnInit(): void {
    this.service.ForAdminOnly();

    let path = window.location.href.split('clients');
    this.currentURL = path[0];
    this.service.NotForDelivery();
    this.display = 'list';
  }

  clearFilter() {
    this.filter = '';
    this.updateFilter();
  }

  updateFilter() {
    if (this.filter.toLowerCase() == "all") {
      this.dataSource = this.service.clients;
    }
    else if (this.filter != '') {
      let items = new Array<clients>();
      let toFilter = this.filter.toLowerCase();

      this.service.clients.forEach(item => {
        if (item.name.toLowerCase().indexOf(toFilter) > -1
          || item.address.toLowerCase().indexOf(toFilter) > -1
          || item.contact.toLowerCase().indexOf(toFilter) > -1)
          items.push(item);
      });
      this.dataSource = items;
    }
  }

  sortData(sort: Sort) {
    if (this.filter != '') {
      let data = this.dataSource.slice();

      if (!sort.active || sort.direction === '') {
        this.dataSource = data;
        return;
      }

      this.dataSource = data.sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'name': return this.service.compare(a.name, b.name, isAsc);
          case 'address': return this.service.compare(a.address, b.address, isAsc);
          case 'contacts': return this.service.compare(a.contact, b.contact, isAsc);
          default: return 0;
        }
      });
    }
  }

  updateAddress() {
    let block = this.item.block ?? "0";
    let lot = this.item.lot ?? "0";

    if (isNaN(Number(block))) {
      this.item.block = "0";
      block = "0";
    }

    if (isNaN(Number(lot))) {
      this.item.lot = "0";
      lot = "0";
    }

    let address = "Blk " + block + " Lot " + lot;
    this.item.address = address;
  }

  add() {
    this.display = 'form';
    this.item = new clients();
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
    this.showDelete = false;
  }

  toDate(action_date: number): Date {
    return this.service.actionDayToDate(action_date);
  }

  displayDelete() {
    this.showDelete = true;
  }

  save() {
    let item = new clients();
    item.key = this.item.key ?? "";
    item.qrCode = this.item.qrCode ?? "";
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
    item.noPromo = this.item.noPromo ?? false;
    item.noQR = this.item.noQR ?? false;
    item.action_date = this.service.actionDate();
    item.action_day = this.service.action_day;

    // trim
    item.name = item.name.trim();
    item.block = item.block.trim();
    item.lot = item.lot.trim();
    item.address = item.address.trim();

    if (item.key == null || item.key == "") {
      item.last_order = item.action_date;
      this.service.db.list('clients/items').push(item);
    }
    else
      this.service.db.object('clients/items/' + item.key).update(item);

    this.filter = '';
    this.dataSource = new Array<clients>();
    this.display = 'list';
  }

  canDelete(): boolean {
    return (this.service.current_user.role == this.service.user_roles.Admin && this.item.key != null && this.item.key != '');
  }

  delete() {
    this.service.db.object('clients/items/' + this.item.key).remove();
    this.service.Message("Client " + this.item.name + " deleted.");
    this.display = 'list';
  }

  qrCode(item: clients) {
    let url = this.currentURL + "billing/" + item.key;
    window.open(url, "_blank");
  }
}
