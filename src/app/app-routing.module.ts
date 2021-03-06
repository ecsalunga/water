import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MenuComponent } from './menu/menu.component';
import { SalesWaterComponent } from './sales-water/sales-water.component';
import { ProductsComponent } from './products/products.component';
import { SummaryComponent } from './summary/summary.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { SettingsComponent } from './settings/settings.component';
import { UsersComponent } from './users/users.component';
import { LoginComponent } from './login/login.component';
import { ClientsComponent } from './clients/clients.component';
import { DailyComponent } from './daily/daily.component';
import { BillingComponent } from './billing/billing.component';
import { ProfileComponent } from './profile/profile.component';
import { CardMakerComponent } from './card-maker/card-maker.component';
import { MessageComponent } from './message/message.component';

const routes: Routes = [
  { path: 'menu', component: MenuComponent },
  { path: 'sales', component: SalesWaterComponent },
  { path: 'expenses', component: ExpensesComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'summary', component: SummaryComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'users', component: UsersComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'login', component: LoginComponent },
  { path: 'clients', component: ClientsComponent },
  { path: 'card', component: CardMakerComponent },
  { path: 'billing/:id', component: BillingComponent },
  { path: 'daily', component: DailyComponent },
  { path: 'message', component: MessageComponent },
  { path: '**', component: MenuComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
