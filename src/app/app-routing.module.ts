import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MenuComponent } from './menu/menu.component';
import { SalesWaterComponent } from './sales-water/sales-water.component';
import { SalesOthersComponent } from './sales-others/sales-others.component';
import { ProductsComponent } from './products/products.component';
import { SummaryComponent } from './summary/summary.component';

const routes: Routes = [
  { path: 'menu', component: MenuComponent },
  { path: 'sales', component: SalesWaterComponent },
  { path: 'others', component: SalesOthersComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'summary', component: SummaryComponent },
  { path: '**', component: MenuComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
