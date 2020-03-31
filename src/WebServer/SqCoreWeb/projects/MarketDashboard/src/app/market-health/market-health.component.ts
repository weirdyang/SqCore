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
  public drawUpPerc =NaN;
}

class TableHeaderRefs {
  public ticker='';
  public reference='';
}

class ConvertUTCTimeToET{
  utcTime: Date;
  constructor(message: Date){
    this.utcTime = message;
  }
  convUTCTime(){
    let monthOriUTC = this.utcTime.getMonth()+1;
    let dayOriUTC = this.utcTime.getDate();
    let dayOfWeekOriUTC = this.utcTime.getDay();
    let offsetToNYTime = -4;
    if (monthOriUTC < 3 || monthOriUTC===12|| (monthOriUTC ===3 && (dayOriUTC-dayOfWeekOriUTC)<8) ||(monthOriUTC ===11 && (dayOriUTC-dayOfWeekOriUTC)>1) ){
      offsetToNYTime=-5;
    }
    
    let time2: Date = this.utcTime;
    time2.setTime(time2.getTime() + offsetToNYTime*60*60000);
    return time2;
  }
    
}


class ConvertLocalTimeToET{
  locTime: Date;
  constructor(message: Date){
    this.locTime = message;
  }
  convLocTime(){
    let yearOri = this.locTime.getUTCFullYear();
    let monthOri = this.locTime.getUTCMonth();
    let dayOri = this.locTime.getUTCDate();
    let hoursOri = this.locTime.getUTCHours();
    let minutesOri = this.locTime.getUTCMinutes();
    let timeUtc= new Date(yearOri, monthOri, dayOri, hoursOri, minutesOri);
    let timeETFromConv = new ConvertUTCTimeToET(timeUtc);
    let timeET = timeETFromConv.convUTCTime();
    
    return timeET;
  }
    
}

class TradingHoursTimer {
  el: Element;
  constructor(element) {
    this.el = element;
    this.run();
    setInterval(() => this.run(), 60000)
  }
  
  run() {
       
    let time: Date = new Date();
    let time2FromConv = new ConvertLocalTimeToET(time);
    let time2 = time2FromConv.convLocTime();
    let hours = time2.getHours();
    let minutes = time2.getMinutes();
    let hoursSt =hours.toString();
    let minutesSt = minutes.toString();
    let dayOfWeek = time2.getDay()+1;
    let timeOfDay =hours*60+minutes;
    // ET idoben: 
    // Pre-market starts: 4:00 - 240 min
    // Regular trading starts: 09:30 - 570 min
    // Regular trading ends: 16:00 - 960 min
    // Post market ends: 20:00 - 1200 min
    let isOpenStr ='';
    if (dayOfWeek>5){
      isOpenStr='Today is weekend. Market is closed.';
    }
    else if (timeOfDay<240){
      isOpenStr='Market is closed. Pre-market starts in '+ Math.floor((240-timeOfDay)/60)+'h'+(240-timeOfDay)%60+'min.';
    }
    else if (timeOfDay<570){
      isOpenStr='Pre-market is open. Regular trading starts in '+ Math.floor((570-timeOfDay)/60)+'h'+(570-timeOfDay)%60+'min.';
    }
    else if (timeOfDay<960){
      isOpenStr='Market is open. Market closes in '+ Math.floor((960-timeOfDay)/60)+'h'+(960-timeOfDay)%60+'min.';
    }
    else if (timeOfDay<1200){
      isOpenStr='Regular trading is closed. Post-market ends in '+ Math.floor((1200-timeOfDay)/60)+'h'+(1200-timeOfDay)%60+'min.';
    }
    else{
      isOpenStr='Market is already closed.';
    }


    if (hoursSt.length < 2) {
      hoursSt = '0' + hoursSt;
    }
    if (minutesSt.length < 2) {
      minutesSt = '0' + minutesSt;
    }
    
    let clockStr = hoursSt + ':' + minutesSt + ' ET' +'<br>'+ isOpenStr;
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
  tableHeaderLinks: TableHeaderRefs[]=[];
  perfIndDaily: string[] = [];
  perfIndPeriod: string[] = [];
  perfIndDD: string[] = [];
  perfIndDU: string[] = [];
  perfIndSelected: string[] =[];
  
  constructor() { }
  
  public perfIndicatorSelector(): void{
    let value = (<HTMLSelectElement>document.getElementById('marketIndicator')).value;
    console.log('FF: ' +value);
    switch (value){
      case 'PerRet':
        this.perfIndSelected=this.perfIndPeriod.slice();
        break;
      case 'DD':
        this.perfIndSelected=this.perfIndDD.slice();
        break;
      case 'DU':
        this.perfIndSelected=this.perfIndDU.slice();
        break;
    }

  }
  
 
  ngOnInit(): void {
    console.log('JS new Date(). Local time.: ' + new Date().toString());
    const etNow = SqNgCommonUtilsTime.ConvertDateLocToEt(new Date());
    console.log('EtNow from SqNgCommonUtilsTime.ConvertLocalTimeToET(): ' + etNow.toString());


    if (this._parentHubConnection != null) {
      // this._parentHubConnection.on('RtMktSumRtStat', (message: RtMktSumRtStat[]) => {
      //   const msgStr = message.map(s => s.secID + ' ? =>' + s.last.toFixed(2).toString()).join(', ');  // %Chg: Bloomberg, MarketWatch, TradingView doesn't put "+" sign if it is positive, IB, CNBC, YahooFinance does. Go as IB.
      //   console.log('ws: RtMktSumRtStat arrived: ' + msgStr);
      //   this.rtMktSumRtQuoteStr = msgStr;
      // });

      // this._parentHubConnection.on('RtMktSumNonRtStat', (message: RtMktSumNonRtStat[]) => {
      //   const msgStr = message.map(s => s.secID + '-' + s.ticker + ':prevClose-' + s.previousClose.toFixed(2).toString() + ' : periodStart-' + s.periodStart.toString() + ':open-' + s.periodOpen.toFixed(2).toString() + '/high-' + s.periodHigh.toFixed(2).toString() + '/low-' + s.periodLow.toFixed(2).toString() + '  *************  ').join(', ');
      //   console.log('ws: RtMktSumNonRtStat arrived: ' + msgStr);
      //   this.rtMktSumPeriodStatStr = msgStr;
      // });

      this._parentHubConnection.on('RtMktSumRtStat', (message: RtMktSumRtStat[]) => {
        this.updateMktSumRt(message, this.marketFullStat);
      });
      
      this._parentHubConnection.on('RtMktSumNonRtStat', (message: RtMktSumNonRtStat[]) => {
        this.updateMktSumNonRt(message, this.marketFullStat);
      });

     new TradingHoursTimer(document.getElementById('tradingHoursTimer'));

    }
  } // ngOnInit()

  onClickChangeLookback() {
    let lookbackStr = (<HTMLSelectElement>document.getElementById('lookBackPeriod')).value;
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
      
      let existingFullStatItems=marketFullStat.filter(fullStatItem=>fullStatItem.secID===singleStockInfo.secID);
      if (existingFullStatItems.length===0){
        marketFullStat.push({secID: singleStockInfo.secID, ticker: '', last: singleStockInfo.last, previousClose: NaN, periodStart: new Date(), periodOpen: NaN, periodHigh: NaN,
      periodLow: NaN, dailyReturn: NaN, periodReturn: NaN, drawDownPerc: NaN, drawUpPerc: NaN});
      }
      else{
        existingFullStatItems[0].last=singleStockInfo.last;
        this.updateReturns(existingFullStatItems[0]);
      }
    }
    
    console.log('Test: ' + marketFullStat.length + marketFullStat[0].last);
    this.updateTableRows(marketFullStat);
  }

  updateMktSumNonRt(message: RtMktSumNonRtStat[], marketFullStat: RtMktSumFullStat[]): void {
    for (const singleStockInfo of message) {
      
      let existingFullStatItems=marketFullStat.filter(fullStatItem=>fullStatItem.secID===singleStockInfo.secID);
      if (existingFullStatItems.length===0){
        marketFullStat.push({secID: singleStockInfo.secID, ticker: singleStockInfo.ticker, last: NaN, previousClose: singleStockInfo.previousClose, periodStart: singleStockInfo.periodStart, periodOpen: singleStockInfo.periodOpen, periodHigh: singleStockInfo.periodHigh,
      periodLow: singleStockInfo.periodLow, dailyReturn: NaN, periodReturn: NaN, drawDownPerc: NaN, drawUpPerc: NaN});
        this.tableHeaderLinks.push({ticker: singleStockInfo.ticker, reference: 'https://uk.tradingview.com/chart/?symbol=' + singleStockInfo.ticker});
      }
      else{
        existingFullStatItems[0].ticker=singleStockInfo.ticker;
        existingFullStatItems[0].previousClose=singleStockInfo.previousClose;
        existingFullStatItems[0].periodStart=singleStockInfo.periodStart;
        existingFullStatItems[0].periodOpen=singleStockInfo.periodOpen;
        existingFullStatItems[0].periodHigh=singleStockInfo.periodHigh;
        existingFullStatItems[0].periodLow=singleStockInfo.periodLow;

        this.updateReturns(existingFullStatItems[0]);
      }
    }
   
    console.log('Test2: ' + marketFullStat.length + ' '  + marketFullStat[0].previousClose);
    this.updateTableRows(marketFullStat);
  }
  
  updateReturns(item: RtMktSumFullStat) {
    item.dailyReturn=item.last>0?item.last/item.previousClose-1:0;
    item.periodReturn=item.last>0?item.last/item.periodOpen-1:item.previousClose/item.periodOpen-1;
    item.drawDownPerc=item.last>0?item.last/Math.max(item.periodHigh,item.last)-1:item.previousClose/item.periodHigh-1;
    item.drawUpPerc=item.last>0?item.last/Math.min(item.periodLow,item.last)-1:item.previousClose/item.periodLow-1;
    
        
    console.log('Test3: ' + this.marketFullStat[0].dailyReturn + ' ' + this.marketFullStat[0].drawDownPerc)
   
  }

  updateTableRows(perfIndicators: RtMktSumFullStat[]) {
    this.perfIndDaily=[];
    this.perfIndPeriod=[];
    this.perfIndDD=[];
    this.perfIndDU=[];
        
    for(const items of perfIndicators ){
      this.perfIndDaily.push((items.dailyReturn>=0?'+':'')+(items.dailyReturn*100).toFixed(2).toString()+'%');
      this.perfIndPeriod.push((items.periodReturn>=0?'+':'')+(items.periodReturn*100).toFixed(2).toString() +'%');
      this.perfIndDD.push((items.drawDownPerc>=0?'+':'')+(items.drawDownPerc*100).toFixed(2).toString()+'%');
      this.perfIndDU.push((items.drawUpPerc>=0?'+':'')+(items.drawUpPerc*100).toFixed(2).toString()+'%');
    }
    this.perfIndicatorSelector()
    
    console.log('ASF1: ' + this.perfIndDaily);
    console.log('ASF2: ' + this.perfIndPeriod);
    console.log('ASF3: ' + this.perfIndDD);
    console.log('ASF4: ' + this.perfIndDU);
    console.log('ASF5: ' + this.tableHeaderLinks[0]);
    
  }
 
}
