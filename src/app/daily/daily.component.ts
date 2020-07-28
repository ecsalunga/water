import { Component, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { Daily } from '../models/daily';
import { Command } from '../models/command';

@Component({
  selector: 'app-daily',
  templateUrl: './daily.component.html',
  styleUrls: ['./daily.component.scss']
})
export class DailyComponent implements OnInit {
  item: Daily;
  uploadType: string;

  constructor(private service: WaterService) { }

  ngOnInit(): void {
    this.item = new Daily();
    this.item.action_day = this.service.action_day;
    this.item.tdsPath = this.service.defaultImagePath;
    this.item.meterPath = this.service.defaultImagePath;
    this.loadData();
    this.service.Changed.subscribe((cmd: Command) => {
      if(cmd.type == this.service.command_types.ImageUploaded) {
        if(this.uploadType == "TDS")
          this.item.tdsPath = cmd.data;
        else if(this.uploadType == "METER")
          this.item.meterPath = cmd.data;
      }
    });
  }

  uploadTds() {
    this.service.imagePath = "/images/tds/" + this.item.action_date + ".png";
    this.uploadType = 'TDS';
    this.service.selectImage();
  }

  uploadMeter() {
    this.service.imagePath = "/images/meter/" + this.item.action_date + ".png";
    this.uploadType = 'METER';
    this.service.selectImage();
  }

  loadData() {
    this.service.db.list<Daily>('daily/items', ref => ref.orderByChild('action_day').equalTo(this.service.action_day)).snapshotChanges().subscribe(records => {
      records.forEach(item => {
        this.item = item.payload.val();
        this.item.key = item.key;
      });
    });
  }

  submit() {
    let item = new Daily();
    item.key = this.item.key ?? "";
    item.coh = this.item.coh;
    item.tds = this.item.tds;
    item.tdsPath = this.item.tdsPath;
    item.meterPath = this.item.meterPath;
    item.meter = this.item.meter ?? 0;
    item.action_day = this.item.action_day;
    item.action_date = this.service.actionDate();

    if (item.key == null || item.key == "")
      this.service.db.list('daily/items').push(item);
    else
      this.service.db.object('daily/items/' + item.key).update(item);

    this.service.Message("Saved.");
  }
}
