import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MarketHealthComponent } from './market-health/market-health.component';
import { CatalystSnifferComponent } from './catalyst-sniffer/catalyst-sniffer.component';
import { QuickfolioNewsComponent } from './quickfolio-news/quickfolio-news.component';
import { TooltipSandpitComponent } from './tooltip-sandpit/tooltip-sandpit.component';
import {ClickOutsideDirective} from './../../../sq-ng-common/src/lib/sq-ng-common.directive.click-outside';

@NgModule({
  declarations: [
    AppComponent,
    MarketHealthComponent,
    CatalystSnifferComponent,
    QuickfolioNewsComponent,
    TooltipSandpitComponent,
    ClickOutsideDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
