import { Component, OnInit, Input } from '@angular/core';
import { HubConnection } from '@microsoft/signalr';
import { SqNgCommonUtilsTime } from './../../../../sq-ng-common/src/lib/sq-ng-common.utils_time';   // direct reference, instead of via 'public-api.ts' as an Angular library. No need for 'ng build sq-ng-common'. see https://angular.io/guide/creating-libraries


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
  public periodMaxDD = NaN;
  public periodMaxDU = NaN;
}

class RtMktSumFullStat {
  public secID = NaN;  // JavaScript Numbers are Always 64-bit Floating Point
  public ticker = '';
  public last  = NaN;
  public previousClose = NaN;
  public periodStart = new Date();
  public periodOpen = NaN;
  public periodHigh = NaN;
  public periodLow = NaN;
  public dailyReturn = NaN;
  public periodReturn = NaN;
  public drawDownPerc = NaN;
  public drawUpPerc = NaN;
  public maxDrawDownPerc = NaN;
  public maxDrawUpPerc = NaN;
}

class TableHeaderRefs {
  public ticker = '';
  public reference = '';
}

class TradingHoursTimer {
  el: Element;
  constructor(element) {
    this.el = element;
    this.run();
    setInterval(() => this.run(), 60000);
  }

  run() {
    const time: Date = new Date();
    const time2 = SqNgCommonUtilsTime.ConvertDateLocToEt(time);
    const hours = time2.getHours();
    const minutes = time2.getMinutes();
    let hoursSt = hours.toString();
    let minutesSt = minutes.toString();
    const dayOfWeek = time2.getDay() + 1;
    const timeOfDay = hours * 60 + minutes;
    // ET idoben:
    // Pre-market starts: 4:00 - 240 min
    // Regular trading starts: 09:30 - 570 min
    // Regular trading ends: 16:00 - 960 min
    // Post market ends: 20:00 - 1200 min
    let isOpenStr = '';
    if (dayOfWeek > 5) {
      isOpenStr = 'Today is weekend. Market is closed.';
    } else if (timeOfDay < 240) {
      isOpenStr = 'Market is closed. Pre-market starts in ' + Math.floor((240 - timeOfDay) / 60) + 'h' + (240 - timeOfDay) % 60 + 'min.';
    } else if (timeOfDay < 570) {
      isOpenStr = 'Pre-market is open. Regular trading starts in ' + Math.floor((570 - timeOfDay) / 60) + 'h' + (570 - timeOfDay) % 60 + 'min.';
    } else if (timeOfDay < 960) {
      isOpenStr = 'Market is open. Market closes in ' + Math.floor((960 - timeOfDay) / 60) + 'h' + (960 - timeOfDay) % 60 + 'min.';
    } else if (timeOfDay < 1200) {
      isOpenStr = 'Regular trading is closed. Post-market ends in ' + Math.floor((1200 - timeOfDay) / 60) + 'h' + (1200 - timeOfDay) % 60 + 'min.';
    } else {
      isOpenStr = 'Market is already closed.';
    }

    if (hoursSt.length < 2) {
      hoursSt = '0' + hoursSt;
    }
    if (minutesSt.length < 2) {
      minutesSt = '0' + minutesSt;
    }

    const clockStr = hoursSt + ':' + minutesSt + ' ET' + '<br>' + isOpenStr;
    this.el.innerHTML = clockStr;
  }
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
  rtMktSumToDashboard = 'Dashboard';
  marketFullStat: RtMktSumFullStat[] = [];
  tableHeaderLinks: TableHeaderRefs[] = [];
  perfIndDaily: string[] = [];
  perfIndPeriod: string[] = [];
  perfIndCDD: string[] = [];
  perfIndCDU: string[] = [];
  perfIndMDD: string[] = [];
  perfIndMDU: string[] = [];
  perfIndSelected: string[] = [];

  constructor() { }

  public perfIndicatorSelector(): void {
    const value = (document.getElementById('marketIndicator') as HTMLSelectElement).value;
    switch (value) {
      case 'PerRet':
        this.perfIndSelected = this.perfIndPeriod.slice();
        break;
      case 'CDD':
        this.perfIndSelected = this.perfIndCDD.slice();
        break;
      case 'CDU':
        this.perfIndSelected = this.perfIndCDU.slice();
        break;
      case 'MDD':
        this.perfIndSelected = this.perfIndMDD.slice();
        break;
      case 'MDU':
        this.perfIndSelected = this.perfIndMDU.slice();
        break;
    }
  }

  ngOnInit(): void {

    if (this._parentHubConnection != null) {
      this._parentHubConnection.on('RtMktSumRtStat', (message: RtMktSumRtStat[]) => {
        const msgStr = message.map(s => s.secID + ' ? =>' + s.last.toFixed(2).toString()).join(', ');  // %Chg: Bloomberg, MarketWatch, TradingView doesn't put "+" sign if it is positive, IB, CNBC, YahooFinance does. Go as IB.
        console.log('ws: RtMktSumRtStat arrived: ' + msgStr);
        this.rtMktSumRtQuoteStr = msgStr;
      });

      this._parentHubConnection.on('RtMktSumNonRtStat', (message: RtMktSumNonRtStat[]) => {
        const msgStr = message.map(s => s.secID + '-' + s.ticker + ':prevClose-' + s.previousClose.toFixed(2).toString() + ' : periodStart-' + s.periodStart.toString() + ':open-' + s.periodOpen.toFixed(2).toString() + '/high-' + s.periodHigh.toFixed(2).toString() + '/low-' + s.periodLow.toFixed(2).toString() + '/mdd' + s.periodMaxDD.toFixed(2).toString() + '/mdu' + s.periodMaxDU.toFixed(2).toString()).join(', ');
        console.log('ws: RtMktSumNonRtStat arrived: ' + msgStr);
        this.rtMktSumPeriodStatStr = msgStr;
      });

      this._parentHubConnection.on('RtMktSumRtStat', (message: RtMktSumRtStat[]) => {
        this.updateMktSumRt(message, this.marketFullStat);
      });

      this._parentHubConnection.on('RtMktSumNonRtStat', (message: RtMktSumNonRtStat[]) => {
        this.updateMktSumNonRt(message, this.marketFullStat);
      });

     // tslint:disable-next-line: no-unused-expression
      new TradingHoursTimer(document.getElementById('tradingHoursTimer'));

    }
  } // ngOnInit()

  onClickChangeLookback() {
    const lookbackStr = (document.getElementById('lookBackPeriod') as HTMLSelectElement).value;
    console.log('Sq.onClickChangeLookback(): ' + lookbackStr);
    if (this._parentHubConnection != null) {
      this._parentHubConnection.invoke('changeLookback', lookbackStr)
        .then((message: RtMktSumNonRtStat[]) => {
          this.updateMktSumNonRt(message, this.marketFullStat);
          const msgStr = message.map(s => s.secID + '-' + s.ticker + ':prevClose-' + s.previousClose.toFixed(2).toString() + ' : periodStart-' + s.periodStart.toString() + ':open-' + s.periodOpen.toFixed(2).toString() + '/high-' + s.periodHigh.toFixed(2).toString() + '/low-' + s.periodLow.toFixed(2).toString() + '  *************  ').join(', ');
          console.log('ws: onClickChangeLookback() got back message ' + msgStr);
          this.rtMktSumPeriodStatStr = msgStr;
        });
    }
  }

  updateMktSumRt(message: RtMktSumRtStat[], marketFullStat: RtMktSumFullStat[]): void {
    for (const singleStockInfo of message) {
      const existingFullStatItems = marketFullStat.filter(fullStatItem => fullStatItem.secID === singleStockInfo.secID);
      if (existingFullStatItems.length === 0) {
        marketFullStat.push({secID: singleStockInfo.secID, ticker: '', last: singleStockInfo.last, previousClose: NaN, periodStart: new Date(), periodOpen: NaN, periodHigh: NaN,
      periodLow: NaN, dailyReturn: NaN, periodReturn: NaN, drawDownPerc: NaN, drawUpPerc: NaN, maxDrawDownPerc: NaN, maxDrawUpPerc: NaN});
      } else {
        existingFullStatItems[0].last = singleStockInfo.last;
        this.updateReturns(existingFullStatItems[0]);
      }
    }

    this.updateTableRows(marketFullStat);
    const x = document.getElementById('perfTable');
    if (typeof(x) !== 'undefined' && x !== null) {
      x.style.visibility = 'visible';
    }
  }

  updateMktSumNonRt(message: RtMktSumNonRtStat[], marketFullStat: RtMktSumFullStat[]): void {
    for (const singleStockInfo of message) {
      const existingFullStatItems = marketFullStat.filter(fullStatItem => fullStatItem.secID === singleStockInfo.secID);
      if (existingFullStatItems.length === 0) {
        marketFullStat.push({secID: singleStockInfo.secID, ticker: singleStockInfo.ticker, last: NaN, previousClose: singleStockInfo.previousClose, periodStart: singleStockInfo.periodStart, periodOpen: singleStockInfo.periodOpen, periodHigh: singleStockInfo.periodHigh,
      periodLow: singleStockInfo.periodLow, dailyReturn: NaN, periodReturn: NaN, drawDownPerc: NaN, drawUpPerc: NaN, maxDrawDownPerc: singleStockInfo.periodMaxDD, maxDrawUpPerc: singleStockInfo.periodMaxDU});
        this.tableHeaderLinks.push({ticker: singleStockInfo.ticker, reference: 'https://uk.tradingview.com/chart/?symbol=' + singleStockInfo.ticker});
      } else {
        existingFullStatItems[0].ticker = singleStockInfo.ticker;
        existingFullStatItems[0].previousClose = singleStockInfo.previousClose;
        existingFullStatItems[0].periodStart = singleStockInfo.periodStart;
        existingFullStatItems[0].periodOpen = singleStockInfo.periodOpen;
        existingFullStatItems[0].periodHigh = singleStockInfo.periodHigh;
        existingFullStatItems[0].periodLow = singleStockInfo.periodLow;

        this.updateReturns(existingFullStatItems[0]);
      }
    }

    this.updateTableRows(marketFullStat);
  }

  updateReturns(item: RtMktSumFullStat) {
    item.dailyReturn = item.last > 0 ? item.last / item.previousClose - 1 : 0;
    item.periodReturn = item.last > 0 ? item.last / item.periodOpen - 1 : item.previousClose / item.periodOpen - 1;
    item.drawDownPerc = item.last > 0 ? item.last / Math.max(item.periodHigh, item.last) - 1 : item.previousClose / item.periodHigh - 1;
    item.drawUpPerc = item.last > 0 ? item.last / Math.min(item.periodLow, item.last) - 1 : item.previousClose / item.periodLow - 1;
  }

  updateTableRows(perfIndicators: RtMktSumFullStat[]) {
    this.perfIndDaily = [];
    this.perfIndPeriod = [];
    this.perfIndCDD = [];
    this.perfIndCDU = [];
    this.perfIndMDD = [];
    this.perfIndMDU = [];

    for (const items of perfIndicators ) {
      if (Number.isNaN(items.dailyReturn) === false) {
      this.perfIndDaily.push((items.dailyReturn >= 0 ? '+' : '') + (items.dailyReturn * 100).toFixed(2).toString() + '%');
      this.perfIndPeriod.push((items.periodReturn >= 0 ? '+' : '') + (items.periodReturn * 100).toFixed(2).toString() + '%');
      this.perfIndCDD.push((items.drawDownPerc >= 0 ? '+' : '') + (items.drawDownPerc * 100).toFixed(2).toString() + '%');
      this.perfIndCDU.push((items.drawUpPerc >= 0 ? '+' : '') + (items.drawUpPerc * 100).toFixed(2).toString() + '%');
      this.perfIndMDD.push((items.maxDrawDownPerc >= 0 ? '+' : '') + (items.maxDrawDownPerc * 100).toFixed(2).toString() + '%');
      this.perfIndMDU.push((items.maxDrawUpPerc >= 0 ? '+' : '') + (items.maxDrawUpPerc * 100).toFixed(2).toString() + '%');
      }
    }
    this.perfIndicatorSelector();
  }
}
