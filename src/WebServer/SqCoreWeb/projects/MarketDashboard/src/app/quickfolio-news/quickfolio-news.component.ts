import { Component, OnInit, Input } from '@angular/core';
import { HubConnection } from '@microsoft/signalr';

class NewsItem {
  public ticker = '';
  public title = '';
  public summary = '';
  public linkUrl = '';
  public downloadTime: Date = new Date();
  public publishDate: Date = new Date();
  public source = '';
  public displayText = '';
}

@Component({
  selector: 'app-quickfolio-news',
  templateUrl: './quickfolio-news.component.html',
  styleUrls: ['./quickfolio-news.component.scss']
})
export class QuickfolioNewsComponent implements OnInit {
  @Input() _parentHubConnection?: HubConnection = undefined; // this property will be input from above parent container

  public request: XMLHttpRequest = new XMLHttpRequest();
  interval: NodeJS.Timeout;
  previewText = '';
  previewTextCommon = '';
  selectedTicker = '';
  previewedCommonNews: NewsItem = new NewsItem();
  previewCommonInterval: NodeJS.Timeout = setInterval(
    () => {
    }, 10 * 60 * 1000); // every 10 minutes do nothing (just avoid compiler error (uninitialised))
  previewedStockNews: NewsItem = new NewsItem();
  previewStockInterval: NodeJS.Timeout = setInterval(
    () => {
    }, 10 * 60 * 1000); // every 10 minutes do nothing (just avoid compiler error (uninitialised))
  stockTickers: string[] = [];
  stockNews: NewsItem[] = [];
  generalNews: NewsItem[] = [
    // {
    //   ticker: '',
    //   title: 'Example news 1: Tesla drives alone',
    //   summary:
    //     'Example summary: Tesla cars are driving alone. They don\'t need to sleep.',
    //   linkUrl: 'https://angular.io/start#components',
    //   downloadTime: '2020-02-02 02:02',
    //   publishDate: '2020-02-02 02:02'
    //   // Source;
    //   // isVisibleFiltered;
    // },
    // {
    //   ticker: '',
    //   title: 'Example news 2: Aaple beats Pear',
    //   summary:
    //     'Example summary: The tech giant AAPL beats Pear in a dramatic fight',
    //   linkUrl: 'https://stockcharts.com/h-sc/ui?s=AAPL',
    //   downloadTime: '2020-02-01 01:01',
    //   publishDate: '2020-02-01 01:01'
    // },
    // {
    //   ticker: '',
    //   title: 'Example news 3: Ebola after Corona',
    //   summary:
    //     'Example summary: The mexican beer manufacturer changes its name to avoid frightening its customers from Corona to Ebola',
    //   linkUrl: 'https://hu.wikipedia.org/wiki/Corona',
    //   downloadTime: '2020-02-02 03:03',
    //   publishDate: '2020-02-02 03:03'
    // },
    // {
    //   ticker: '',
    //   title: 'Example news 4: The queen is retiring',
    //   summary:
    //     'Example summary 4: Elisabeth wants to start a new life, but not as queen. Its too boring - she sad.',
    //   linkUrl: 'https://hu.wikipedia.org/wiki/Queen',
    //   downloadTime: '2020-01-02 03:04',
    //   publishDate: '2020-01-02 03:04'
    // }
  ];

  constructor() {
    this.interval = setInterval(
      () => {
        this.updateNewsDownloadTextValues();
        this.UpdatePreviewHighlightCommon();
      }, 15000); // every 15 sec
  }

  public mouseEnterCommon(news: NewsItem): void {
    // console.log('mouse Enter Common' + news.linkUrl);
    this.previewTextCommon = news.summary;
    this.previewedCommonNews = news;
    this.UpdatePreviewHighlightCommon();
  }

  UpdatePreviewHighlightCommon() {
    const newsElements = document.querySelectorAll('.newsItemCommon');
    console.log('newsItems count = ' + newsElements.length);
    for (const newsElement of newsElements) {
      // console.log('news ' + newsElement);
      const hyperLink = newsElement.getElementsByClassName('newsHyperlink')[0];
      // console.log('news ticker count = ' + tickerSpan.innerHTML);
      if (hyperLink.getAttribute('href') === this.previewedCommonNews.linkUrl) {
        newsElement.className = newsElement.className.replace(' previewed', '') + ' previewed';
        // console.log('setting to previewed');
      } else {
        newsElement.className = newsElement.className.replace(' previewed', '');
      }
    }
    clearInterval(this.previewCommonInterval);
    // this.previewCommonInterval = null;
  }

  public mouseEnter(news: NewsItem): void {
    // console.log('mouse Enter ' + news.linkUrl);
    this.previewText = news.summary;
    this.previewedStockNews = news;
    this.UpdatePreviewHighlightStock();
  }

  UpdatePreviewHighlightStock() {
    const newsElements = document.querySelectorAll('.newsItemStock');
    // console.log('newsItems count = ' + newsElements.length);
    for (const newsElement of newsElements) {
      // console.log('news ' + newsElement);
      const hyperLink = newsElement.getElementsByClassName('newsHyperlink')[0];
      // console.log('news ticker count = ' + tickerSpan.innerHTML);
      if (hyperLink.getAttribute('href') === this.previewedStockNews.linkUrl) {
        newsElement.className = newsElement.className.replace(' previewed', '') + ' previewed';
        // console.log('setting to previewed');
      } else {
        newsElement.className = newsElement.className.replace(' previewed', '');
      }
    }
  }

  public reloadClick(event): void {
    // console.log('reload clicked');
    if (this._parentHubConnection != null) {
      this._parentHubConnection.send('ReloadQuickfolio');
    }
  }

  public menuClick(event, ticker: string): void {
    // console.log('menu clicked xx' + ticker + 'xx');
    if (ticker === 'All assets') {
      this.selectedTicker = '';
    } else {
      this.selectedTicker = ticker;
    }
    this.UpdateNewsVisibility();
  }

  UpdateNewsVisibility() {
    const menuElements = document.querySelectorAll('.menuElement');
    for (const menuElement of menuElements) {
      // console.log('menu element found xx' + menuElement.innerHTML + 'xx');
      // menuElement.className += ' active';
      let ticker = this.selectedTicker;
      if (ticker === '') {
        ticker = 'All assets';
      }
      menuElement.className = 'menuElement';
      if (menuElement.innerHTML === ticker) {
        // console.log('menu element found ' + ticker);
        menuElement.className += ' active';
      }
    }
    const newsElements = document.querySelectorAll('.newsItemStock');
    // console.log('newsItems count = ' + newsElements.length);
    for (const newsElement of newsElements) {
      // console.log('news ' + newsElement);
      const tickerSpan = newsElement.getElementsByClassName('newsTicker')[0];
      // console.log('news ticker count = ' + tickerSpan.innerHTML);
      if (this.TickerIsPresent(tickerSpan.innerHTML, this.selectedTicker)) {
        newsElement.className = newsElement.className.replace(' inVisible', '');
      } else {
        newsElement.className = newsElement.className.replace(' inVisible', '') + ' inVisible';
      }
    }
  }

  TickerIsPresent(tickersConcatenated: string, selectedTicker: string): boolean {
    if (selectedTicker === '') {
      return true;
    }
    const tickers = tickersConcatenated.split(',');
    let foundSame = false;
    tickers.forEach(existingTicker => {
      if (existingTicker.trim() === selectedTicker) {
        foundSame = true;
      }
    });
    return foundSame;
  }

  ngOnInit(): void {
    if (this._parentHubConnection != null) {
      this._parentHubConnection.on(
        'quickfNewsCommonNewsUpdated',
        (message: NewsItem[]) => {
          console.log('Quickfolio News: general news update arrived');
          this.extractNewsList(message, this.generalNews);
          this.previewCommonInterval = setInterval(
            () => {
              this.SetCommonPreviewIfEmpty();
            }, 1000); // after 1 sec
        }
      );
      this._parentHubConnection.on(
        'stockTickerList',
        (message: string[]) => {
          console.log('Quickfolio News: stock ticker list update arrived');
          this.stockTickers = message;
          console.log('Init menu');
          this.menuClick(null, 'All assets');
          this.removeUnreferencedNews();
        }
      );
      this._parentHubConnection.on(
        'quickfNewsStockNewsUpdated',
        (message: NewsItem[]) => {
          console.log('Quickfolio News: stock news update arrived');
          this.extractNewsList(message, this.stockNews);
          this.UpdateNewsVisibility();
          this.previewStockInterval = setInterval(
            () => {
              this.SetStockPreviewIfEmpty();
            }, 1000); // after 1 sec
        }
      );
    }
  }

  SetStockPreviewIfEmpty() {
    if (this.previewText === '') {
      if (this.stockNews.length > 0) {
        this.mouseEnter(this.stockNews[0]);
      }
    }
  }

  SetCommonPreviewIfEmpty() {
    if (this.previewTextCommon === '') {
      if (this.generalNews.length > 0) {
        this.mouseEnterCommon(this.generalNews[0]);
        // console.log('SetCommonPreviewIfEmpty ' + this.generalNews[0].linkUrl);
      }
    }
  }

  removeUnreferencedNews() {
    this.stockNews = this.stockNews.filter(news => this.NewsItemHasTicker(news));
  }

  NewsItemHasTicker(news: NewsItem): boolean {
    let tickers = news.ticker.split(',');
    tickers = tickers.filter(existingTicker => this.stockTickers.includes(existingTicker));
    news.ticker = tickers.join(', ');
    return tickers.length > 0;
  }


  extractNewsList(message: NewsItem[], newsList: NewsItem[]): void {
    // console.log('new common message list ' + message.length);
    for (const newNews of message) {
      // console.log('new message ' + newNews.linkUrl);
      this.insertMessage(newsList, newNews);
    }
  }

  insertMessage(messages: NewsItem[], newItem: NewsItem): void {
    let index = 0;
    let foundOlder = false;
    while ((index < messages.length) && !foundOlder) {
      if (messages[index].linkUrl === newItem.linkUrl) {
        this.extendTickerSection(messages[index], newItem.ticker);
        return;
      }
      foundOlder = newItem.publishDate > messages[index].publishDate;
      if (!foundOlder) {
        index++;
      }
    }
    this.updateNewsDownloadText(newItem);
    messages.splice(index, 0, newItem);
  }

  updateNewsDownloadTextValues() {
    for (const news of this.generalNews) {
      this.updateNewsDownloadText(news);
    }
    for (const news of this.stockNews) {
      this.updateNewsDownloadText(news);
    }
  }

  updateNewsDownloadText(newsItem: NewsItem) {
    newsItem.displayText = this.getpublishedString(newsItem.publishDate);
  }

  extendTickerSection(news: NewsItem, newTicker: string) {
    const tickers = news.ticker.split(',');
    let foundSame = false;
    tickers.forEach(existingTicker => {
      if (existingTicker.trim() === newTicker) {
        foundSame = true;
      }
    });
    if (!foundSame) {
      news.ticker += ', ' + newTicker;
    }
  }

  getpublishedString(date: Date) {
    // console.log('since ' + date + '  ...  ' + new Date());
    const downloadDate = new Date(date);
    const timeDiffInSecs = Math.floor((new Date().getTime() - downloadDate.getTime()) / 1000);
    // console.log('since ' + timeDiffInSecs);
    if (timeDiffInSecs < 60) {
      return timeDiffInSecs.toString() + 'sec ago';
    }
    let timeDiffMinutes = Math.floor(timeDiffInSecs / 60);
    if (timeDiffMinutes < 60) {
      return timeDiffMinutes.toString() + 'min ago';
    }
    const timeDiffHours = Math.floor(timeDiffMinutes / 60);
    timeDiffMinutes = timeDiffMinutes - 60 * timeDiffHours;
    if (timeDiffHours < 24) {
      return timeDiffHours.toString() + 'h ' + timeDiffMinutes.toString() + 'm ago';
    }
    const timediffDays = Math.floor(timeDiffHours / 24);
    return timediffDays.toString() + ' days ago';
  }
} // class
