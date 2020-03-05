import { Component, OnInit, Input } from '@angular/core';
import { HubConnection } from '@microsoft/signalr';

class RtMktSummaryStock {
  public ticker = '';
  public lastPrice  = 0.0;
  public previousClose  = 0.0;
  public previousCloseIex  = 0.0;
}


@Component({
  selector: 'app-market-health',
  templateUrl: './market-health.component.html',
  styleUrls: ['./market-health.component.scss']
})
export class MarketHealthComponent implements OnInit {

  @Input() _parentHubConnection?: HubConnection = undefined;    // this property will be input from above parent container

  rtMktSummaryFullStr = '';

  constructor() { }

  ngOnInit(): void {
    if (this._parentHubConnection != null) {
      this._parentHubConnection.on('rtMktSummaryUpdate', (message: RtMktSummaryStock[]) => {
        const msgStr = message.map(s => s.ticker + ':yf-' + s.previousClose.toFixed(2).toString() + '/iex-' + s.previousCloseIex.toFixed(2).toString() + '=>' + s.lastPrice.toFixed(2).toString()).join(', ');  // Bloomberg, MarketWatch, TradingView doesn't put "+" sign if it is positive, IB, CNBC, YahooFinance does. Go as IB.
        console.log('ws: rtMktSummaryUpdate arrived: ' + msgStr);
        this.rtMktSummaryFullStr = msgStr;
      });
    }
  } // ngOnInit()
}
