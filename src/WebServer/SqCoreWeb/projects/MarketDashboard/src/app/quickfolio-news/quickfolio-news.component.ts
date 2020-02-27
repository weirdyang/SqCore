import { Component, OnInit, Input } from '@angular/core';
import { HubConnection } from '@microsoft/signalr';

class NewsItem {
  public title = '';
  public summary = '';
  public linkUrl = '';
  public downloadTime = '';
  public publishDate = '';
}

@Component({
  selector: 'app-quickfolio-news',
  templateUrl: './quickfolio-news.component.html',
  styleUrls: ['./quickfolio-news.component.scss']
})
export class QuickfolioNewsComponent implements OnInit {
  @Input() _parentHubConnection?: HubConnection = undefined; // this property will be input from above parent container

  request = new XMLHttpRequest();
  generalNews: NewsItem[] = [];
  // newsItems;

  testStr = 'QuickfolioNewsComponent.testStr here';

  constructor() {
  }

  ngOnInit(): void {
    if (this._parentHubConnection != null) {
      this._parentHubConnection.on(
        'quickfNewsOnConnected',
        (message: string) => {
          console.log('ws: quickfNewsOnConnected arrived: ' + message);
          this.testStr = message;
        }
      );
    }

    this.generalNews = [
      {
        title: 'Example news 1: Tesla drives alone',
        summary:
          'Example summary: Tesla cars are driving alone. They don\'t need to sleep.',
        linkUrl: 'https://angular.io/start#components',
        downloadTime: '2020-02-02 02:02',
        publishDate: '2020-02-02 02:02'
        // Source;
        // isVisibleFiltered;
      },
      {
        title: 'Example news 2: Aaple beats Pear',
        summary:
          'Example summary: The tech giant AAPL beats Pear in a dramatic fight',
        linkUrl: 'https://stockcharts.com/h-sc/ui?s=AAPL',
        downloadTime: '2020-02-01 01:01',
        publishDate: '2020-02-01 01:01'
      },
      {
        title: 'Example news 3: Ebola after Corona',
        summary:
          'Example summary: The mexican beer manufacturer changes its name to avoid frightening its customers from Corona to Ebola',
        linkUrl: 'https://hu.wikipedia.org/wiki/Corona',
        downloadTime: '2020-02-02 03:03',
        publishDate: '2020-02-02 03:03'
      },
      {
        title: 'Example news 4: The queen is retiring',
        summary:
          'Example summary 4: Elisabeth wants to start a new life, but not as queen. Its too boring - she sad.',
        linkUrl: 'https://hu.wikipedia.org/wiki/Queen',
        downloadTime: '2020-01-02 03:04',
        publishDate: '2020-01-02 03:04'
      }
    ];
    // this.generalNews = [];

    this.request.open(
      'GET',
      'https://www.cnbc.com/id/100003114/device/rss/rss.html'
    );
    this.request.onreadystatechange = this.readyStateChanged;
  }

  readyStateChanged(): void {
    if (this.request.readyState === 4 && this.request.status === 200) {
      if (this.request.responseXML == null) {
        return;
      }
      const items = this.request.responseXML.getElementsByTagName('item');
      // alert(items.length);
      this.generalNews = [];
      const downloadTime =
        new Date().toISOString().slice(0, 10) +
        ' ' +
        new Date().toISOString().slice(11, 19);

      if (items == null) {
        return;
      }

      // @ts-ignore prefer-for-of
      // for (let i = 0; i < items.length; i++) {
        // console.log(items[i]);
        // console.log('LinkUrl = ' + items[i].getElementsByTagName('link')[0].textContent);
        // console.log('Title = ' + items[i].getElementsByTagName('title')[0].textContent);
        // console.log('Summary = ' + items[i].getElementsByTagName('description')[0].textContent);
        // console.log('PublishDate = ' + items[i].getElementsByTagName('pubDate')[0].textContent);
      const titleXXX = items[0].getElementsByTagName('title')[0];
      const summaryXXX = items[0].getElementsByTagName('description')[0];
      const linkUrlXXX = items[0].getElementsByTagName('link')[0];
      const publishDateXXX = items[0].getElementsByTagName('pubDate')[0];
      if (titleXXX.textContent == null) {
        return;
      }
      if (summaryXXX.textContent == null) {
        return;
      }
      if (linkUrlXXX.textContent == null) {
        return;
      }
      if (publishDateXXX.textContent == null) {
        return;
      }
      this.generalNews.push({
        title: titleXXX.textContent.toString(),
        summary: summaryXXX.textContent.toString(),
        linkUrl: linkUrlXXX.textContent.toString(),
        downloadTime: downloadTime.toString(),
        publishDate: publishDateXXX.textContent.toString(),
      });
      // }

      // const newsItems = request.responseXML.getElementsByTagName("item");
      // alert(newsItems.length)
    }
  }
} // class
