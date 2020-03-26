import { Component, OnInit, Input } from '@angular/core';
import { HubConnection } from '@microsoft/signalr';

class RtMktSumRtStat {
  public secID = NaN;
  public last  = NaN;
}

class RtMktSumNonRtStat {
  public secID = NaN;  // JavaScript Numbers are Always 64-bit Floating Point
  public ticker = '';
  public previousClose = NaN;
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
      this._parentHubConnection.on('RtMktSumRtStat', (message: RtMktSumRtStat[]) => {
        const msgStr = message.map(s => s.secID + ' ? =>' + s.last.toFixed(2).toString()).join(', ');  // %Chg: Bloomberg, MarketWatch, TradingView doesn't put "+" sign if it is positive, IB, CNBC, YahooFinance does. Go as IB.
        console.log('ws: RtMktSumRtStat arrived: ' + msgStr);
        this.rtMktSumRtQuoteStr = msgStr;
      });

      this._parentHubConnection.on('RtMktSumNonRtStat', (message: RtMktSumNonRtStat[]) => {
        const msgStr = message.map(s => s.secID + '-' + s.ticker + ':prevClose-' + s.previousClose.toFixed(2).toString() + ' : periodStart-' + s.periodStart.toString() + ':open-' + s.periodOpen.toFixed(2).toString() + '/high-' + s.periodHigh.toFixed(2).toString() + '/low-' + s.periodLow.toFixed(2).toString() + '  *************  ').join(', ');
        console.log('ws: RtMktSumNonRtStat arrived: ' + msgStr);
        this.rtMktSumPeriodStatStr = msgStr;
      });
    }
  } // ngOnInit()

  onClickChangeLookback(lookbackStr: string) {
    console.log('Sq.onClickChangeLookback(): ' + lookbackStr);
    if (this._parentHubConnection != null) {
      this._parentHubConnection.invoke('changeLookback', lookbackStr)
        .then((message: RtMktSumNonRtStat[]) => {
          const msgStr = message.map(s => s.secID + '-' + s.ticker + ':prevClose-' + s.previousClose.toFixed(2).toString() + ' : periodStart-' + s.periodStart.toString() + ':open-' + s.periodOpen.toFixed(2).toString() + '/high-' + s.periodHigh.toFixed(2).toString() + '/low-' + s.periodLow.toFixed(2).toString() + '  *************  ').join(', ');
          console.log('ws: onClickChangeLookback() got back message ' + msgStr);
          this.rtMktSumPeriodStatStr = msgStr;
        });
    }
  }


}
