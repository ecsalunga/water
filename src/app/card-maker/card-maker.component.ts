import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { WaterService } from '../water.service';
import { clients } from '../models/clients';
import { Card } from '../models/card';
import { NgxQrcodeElementTypes, NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';
import { Sort } from '@angular/material/sort';
import { Document, Packer, Paragraph, Media, Table, TableRow, TableCell, AlignmentType, HeadingLevel, TextRun, WidthType } from "docx";
import { saveAs } from "file-saver/FileSaver";

@Component({
  selector: 'app-card-maker',
  templateUrl: './card-maker.component.html',
  styleUrls: ['./card-maker.component.scss']
})
export class CardMakerComponent implements OnInit {
  @ViewChild('dataContainer') dataContainer: ElementRef;
  @ViewChild('dataRandomContainer') dataRandomContainer: ElementRef;

  elementType = NgxQrcodeElementTypes.URL;
  correctionLevel = NgxQrcodeErrorCorrectionLevels.HIGH;
  
  displayedColumns: string[] = ['name', 'address'];
  currentURL: string;
  itemSelected = new Array<clients>();
  itemCards = new Array<any>();
  randomItems = new Array<string>();
  cards: Array<Card>;
  dataSource = new Array<clients>();
  filter: string = '';
  pages: number = 1;
  pageCount: number = 1;

  constructor(public service: WaterService) { }

  ngOnInit(): void {
    let path = window.location.href.split('card');
    this.currentURL = path[0];
  }

  clearFilter() {
    this.filter = '';
    this.updateFilter();
  }

  updateFilter() {
    if(this.filter != '') {
      let items = new Array<clients>();
      let toFilter = this.filter.toLowerCase();
  
      this.service.clients.forEach(item => {
        if(item.name.toLowerCase().indexOf(toFilter) > -1
          || item.address.toLowerCase().indexOf(toFilter) > -1
          || item.contact.toLowerCase().indexOf(toFilter) > -1)
          items.push(item);
      });

      this.dataSource = items;
    }
  }

  sortData(sort: Sort) {
    if(this.filter != '') {
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
          default: return 0;
        }
      });
    }
  }

  select(item: clients) {
    let reSelected = false;
    this.itemSelected.forEach(i => {
      let items = new Array<clients>();
      this.itemSelected.forEach(i => {
        if(i.key != item.key)
          items.push(i);
      });

      if(items.length != this.itemSelected.length) {
        reSelected = true;
        this.itemSelected = items;
        this.loadSelected();
      }
    });
    
    if(!reSelected && this.itemSelected.length < 9) {
        this.itemSelected.push(item);
        this.loadSelected();
    }
  }

  isSelected(item: clients): boolean {
    let isSelected = false;
    this.itemSelected.forEach(i => {
      this.itemSelected.forEach(i => {
        if(i.key == item.key)
          isSelected = true;
      });
    });

    return isSelected;
  }

  loadSelected() {
    this.itemCards = new Array<any>();

    let cardItem = { item1: null, item2: null, item3: null};
    let ctr = 0;
    this.itemSelected.forEach(item => {
      ctr++;

      if(ctr == 1)
        cardItem.item1 = item;
      else if(ctr == 2)
        cardItem.item2 = item;
      else if(ctr == 3) {
        cardItem.item3 = item;
        this.itemCards.push(cardItem);
        cardItem = { item1: null, item2: null, item3: null};
        ctr = 0;
      }
    });

    if(ctr != 0)
      this.itemCards.push(cardItem);
  }

  getClientPath(item: clients) {
    return this.currentURL + "billing/" + item.key;
  }

  getPath(key: string) {
    return this.currentURL + "billing/" + key;
  }

  generateRandom() {
    this.pageCount = this.pages;
    this.randomItems = new Array<string>();
    let total = (this.pageCount * 9);

    for(let x = 0; x < total; x++)
      this.randomItems.push(this.service.getRandomString());

    setTimeout(() => { this.downloadRandom() }, 1000 );
  }

  downloadRandom() {
    let items = this.dataRandomContainer.nativeElement.childNodes;
    this.cards = new Array<Card>();
    items.forEach(div => {
      if(div.id != null) {
        let card = new Card();
        card.key = div.id;
        card.name = "";
        card.address = "";

        div.childNodes.forEach(element => {
          if(element.tagName == "NGX-QRCODE") {
            let img = element.firstChild.firstChild;
            card.imageSrc = img.src;
          }
        });

        this.cards.push(card);
      }
    });

    this.download();
  }

  generate() {
    let items = this.dataContainer.nativeElement.childNodes;

    this.cards = new Array<Card>();
    items.forEach(tr => {
      tr.childNodes.forEach(td => {
        if(td.id != null) {
          let card = new Card();
          card.key = td.id;
  
          this.itemSelected.forEach(item => {
            if(item.key == card.key) {
              card.name = item.name;
              card.address = item.address;
            }
          });
  
          td.childNodes.forEach(element => {
            if(element.tagName == "NGX-QRCODE") {
              let img = element.firstChild.firstChild;
              card.imageSrc = img.src;
            }
          });
          
          this.cards.push(card);
        }
      });
    });

    this.download();
  }

  download() {
    let doc = new Document();
    let trs = new Array<TableRow>();
    let tcs = new Array<TableCell>();
    let ctr = 0;

    this.cards.forEach(card => {
      ctr++;

      let margin  =  new Paragraph({});

      let acqua =  new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
              size: 32,
              text: "Acqua Perfetta",
              font: {
                  name: "American Typewriter"
              }
          })
        ]
      });

      let address =  new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
              size: 20,
              text: "Blk 25 Lot 9 Fiesta Ave. Fiesta Pandan",
              font: {
                  name: "Calibri Light"
              }
          })
        ]
      });

      let contact =  new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
              size: 32,
              bold: true,
              text: "+63 927 968 1748",
              font: {
                  name: "Calibri Light"
              }
          })
        ]
      });

      let img = Media.addImage(doc, card.imageSrc, 190, 190);
      let qr = new Paragraph({
        alignment: AlignmentType.CENTER
      });

      qr.addChildElement(img);

      let client =  new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
              size: 12,
              text: card.address,
              font: {
                  name: "Calibri Light"
              }
          })
        ]
      });

      let tc = new TableCell({ 
        children: [margin, margin, acqua, address, contact, client, qr],
        width: {
          size: 32,
          type: WidthType.PERCENTAGE,
        }
      });

      tcs.push(tc);

      if(ctr == 3) {
        ctr = 0;
        let tr = new TableRow({
          children: tcs
        });
        trs.push(tr);
        tcs = new Array<TableCell>();
      }
    });

    if(tcs.length > 0) {
      let tr = new TableRow({
        children: tcs
      });
      
      trs.push(tr);
    }

    let trGroup = new Array<TableRow>();
    ctr = 0;
    trs.forEach(tr => {
      ctr++;
      trGroup.push(tr);

      if(ctr >= 3) {
        let table = new Table({
          rows: trGroup
        });

        doc.addSection({
          margins: {
            top: 0,
            bottom: 0
          },
          children: [table],
        });
        trGroup = new Array<TableRow>();
        ctr = 0;
      }
    });

    if(ctr > 0) {
      let table = new Table({
        rows: trGroup
      });

      doc.addSection({
        margins: {
          top: 0,
          bottom: 0
        },
        children: [table],
      });
    }
    
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, "card.docx");
    });
  }
}