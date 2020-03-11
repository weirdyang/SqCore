import { Component, OnInit, Input } from '@angular/core';
import { HubConnection } from '@microsoft/signalr';

class RtMktSummaryPrevClose {
  public secID = NaN;
  public ticker = '';
  public prevClose  = NaN;
  public prevCloseIex  = NaN;
}

class RtMktSummaryRtQuote {
  public secID = NaN;
  public ticker = '';
  public last  = NaN;
}

class RtMktSummaryPeriodStat {
  public secID = NaN;  // JavaScript Numbers are Always 64-bit Floating Point
  public ticker = '';
  public periodStart = new Date();
  public periodOpen = NaN;
  public periodHigh = NaN;
  public periodLow = NaN;
}



@Component({
  selector: 'app-market-health',
  templateUrl: './market-health.component.html',
  styleUrls: ['./market-health.component.scss']
})
export class MarketHealthComponent implements OnInit {

  @Input() _parentHubConnection?: HubConnection = undefined;    // this property will be input from above parent container

  rtMktSumPrevCloseStr = 'A';
  rtMktSumRtQuoteStr = 'B';
  rtMktSumPeriodStatStr = 'C';

  constructor() { }

  ngOnInit(): void {
    if (this._parentHubConnection != null) {
      this._parentHubConnection.on('rtMktSummary_prevClose', (message: RtMktSummaryPrevClose[]) => {
        const msgStr = message.map(s => s.ticker + ':yf-' + s.prevClose.toFixed(2).toString() + '/iex-' + s.prevCloseIex.toFixed(2).toString() + '=> ? ' ).join(', ');
        console.log('ws: rtMktSummary_prevClose arrived: ' + msgStr);
        this.rtMktSumPrevCloseStr = msgStr;
      });

      this._parentHubConnection.on('rtMktSummary_rtQuote', (message: RtMktSummaryRtQuote[]) => {
        const msgStr = message.map(s => s.ticker + ' ? =>' + s.last.toFixed(2).toString()).join(', ');  // %Chg: Bloomberg, MarketWatch, TradingView doesn't put "+" sign if it is positive, IB, CNBC, YahooFinance does. Go as IB.
        console.log('ws: rtMktSummary_rtQuote arrived: ' + msgStr);
        this.rtMktSumRtQuoteStr = msgStr;
      });

      this._parentHubConnection.on('rtMktSummary_periodStat', (message: RtMktSummaryPeriodStat[]) => {
        const msgStr = message.map(s => s.ticker + ':open-' + s.periodOpen.toFixed(2).toString() + '/high-' + s.periodHigh.toFixed(2).toString() + '/low-' + s.periodLow.toFixed(2).toString() + '=> ? ' ).join(', ');
        console.log('ws: rtMktSummary_periodStat arrived: ' + msgStr);
        this.rtMktSumPeriodStatStr = msgStr;
      });
    }
  } // ngOnInit()
}
