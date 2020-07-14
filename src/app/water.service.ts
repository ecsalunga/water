import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class WaterService {
  Action_Day: number;
  
  constructor(public db: AngularFireDatabase) {
    this.Action_Day =  this.actionDay();
  }

  public actionDate(): number {
    let date: Date = new Date();
    return this.getActionDate(date);
  }

  public actionDay(): number {
    let date: Date = new Date();
    return this.getActionDay(date);
  }

  public getActionDate(date: Date): number {
    let strDate = date.getFullYear() + this.az(date.getMonth() + 1) + this.az(date.getDate()) + this.az(date.getHours()) + this.az(date.getMinutes()) + this.az(date.getSeconds());
    return parseInt(strDate);
  }

  public getActionDay(date: Date): number {
    let strDate = date.getFullYear() + this.az(date.getMonth() + 1) + this.az(date.getDate());
    return parseInt(strDate);
  }

  public actionDateToDate(num: number): Date {
    let val = num.toString();
    let year = parseInt(val.substring(0, 4));
    let month = parseInt(val.substring(4, 6));
    let day = parseInt(val.substring(6, 8));
    let hour = parseInt(val.substring(8, 10));
    let minute = parseInt(val.substring(10, 12));
    let second = parseInt(val.substring(12, 14));

    return new Date(year, month - 1, day, hour, minute, second);
  }

  public actionDayToDate(keyDay: number): Date {
    return this.actionDateToDate(parseInt(keyDay + '000000'));
  }

  private az(val: number): string {
    let num = val.toString();
    if (num.length < 2)
      num = "0" + num;

    return num;
  }
}
