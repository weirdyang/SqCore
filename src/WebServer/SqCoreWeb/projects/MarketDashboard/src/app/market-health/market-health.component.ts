import { Component, OnInit, Input } from '@angular/core';
import { HubConnection } from '@microsoft/signalr';

class MktSummaryStock {
  public ticker = '';
  public previousClose  = 0.0;
  public lastPrice  = 0.0;
}


@Component({
  selector: 'app-market-health',
  templateUrl: './market-health.component.html',
  styleUrls: ['./market-health.component.scss']
})
export class MarketHealthComponent implements OnInit {

  @Input() _parentHubConnection?: HubConnection = undefined;    // this property will be input from above parent container

  mktSummaryFullStr = '';

  constructor() { }

  ngOnInit(): void {
    if (this._parentHubConnection != null) {
      this._parentHubConnection.on('mktSummaryUpdate', (message: MktSummaryStock[]) => {
        const msgStr = message.map(s => s.ticker + ':' + s.previousClose.toFixed(2).toString() + '=>' + s.lastPrice.toFixed(2).toString()).join(', ');  // Bloomberg, MarketWatch, TradingView doesn't put "+" sign if it is positive, IB, CNBC, YahooFinance does. Go as IB.
        console.log('ws: mktSummaryUpdate arrived: ' + msgStr);
        this.mktSummaryFullStr = msgStr;
      });
    }
  } // ngOnInit()
}
