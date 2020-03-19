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
}

@Component({
  selector: 'app-quickfolio-news',
  templateUrl: './quickfolio-news.component.html',
  styleUrls: ['./quickfolio-news.component.scss']
})
export class QuickfolioNewsComponent implements OnInit {
  @Input() _parentHubConnection?: HubConnection = undefined; // this property will be input from above parent container

  public request: XMLHttpRequest = new XMLHttpRequest();
  previewText = '';
  selectedTicker = '';
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
  }

  public mouseEnter(news: NewsItem): void {
    // console.log('mouse Enter ' + news.linkUrl);
    this.previewText = news.summary;
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
        newsElement.className = 'newsItemStock';
      } else {
        newsElement.className += ' inVisible';
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
          this.extractNewsList(message, this.generalNews);
        }
      );
      this._parentHubConnection.on(
        'stockTickerList',
        (message: string[]) => {
          this.stockTickers = message;
          console.log('Init menu');
          this.menuClick(null, 'All assets');
        }
      );
      this._parentHubConnection.on(
        'quickfNewsStockNewsUpdated',
        (message: NewsItem[]) => {
          this.extractNewsList(message, this.stockNews);
          this.UpdateNewsVisibility();
        }
      );
    }
  }


  extractNewsList(message: NewsItem[], newsList: NewsItem[]): void {
    // console.log('new common message list ' + message.length);
    for (const newNews of message) {
      // console.log('new message ' + newNews.linkUrl);
      this.insertMessage(newsList, newNews);
    }
  }

  // extractNews(message, isCommon): void {
  //   if (isCommon) {
  //     this.generalNews = [];
  //   } else {
  //     this.stockNews = [];
  //   }
  //   while (message.startsWith('news')) {
  //     message = message.substr(11); // trim news_ticker
  //     const tickerLength = message.search('news_title');
  //     const ticker = message.substr(0, tickerLength);
  //     message = message.substr(tickerLength + 10); // trim news_title
  //     const titleLength = message.search('news_summary');
  //     const title = message.substr(0, titleLength);
  //     message = message.substr(titleLength + 12); // trim news_summary
  //     const summaryLength = message.search('news_link');
  //     const summary = message.substr(0, summaryLength);
  //     message = message.substr(summaryLength + 9); // trim news_link
  //     const linkLength = message.search('news_downloadTime');
  //     const link = message.substr(0, linkLength);
  //     message = message.substr(linkLength + 17); // trim news_downloadTime
  //     const dTimeLength = message.search('news_publishDate');
  //     const dTime = message.substr(0, dTimeLength);
  //     message = message.substr(dTimeLength + 16); // trim news_publishDate
  //     const pDateLength = message.search('news_source');
  //     const pDate = message.substr(0, pDateLength);
  //     message = message.substr(pDateLength + 11); // trim news_source
  //     const nSourceLength = message.search('news_end');
  //     // const nSource = message.substr(0, nSourceLength);
  //     message = message.substr(nSourceLength + 8); // trim news_end
  //     if (isCommon) {
  //       this.insertMessage(this.generalNews,
  //         {
  //           ticker: '',
  //           title,
  //           summary,
  //           linkUrl: link,
  //           downloadTime: dTime,
  //           publishDate: pDate,
  //           source: ''
  //         });
  //     } else {
  //       this.insertMessage(this.stockNews,
  //         {
  //           ticker,
  //           title,
  //           summary,
  //           linkUrl: link,
  //           downloadTime: dTime,
  //           publishDate: pDate,
  //           source: ''
  //         });
  //     }
  //   }
  // }

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
    messages.splice(index, 0, newItem);
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
} // class
