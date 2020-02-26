import { Component, OnInit, Input } from '@angular/core';
import { HubConnection } from '@microsoft/signalr';


@Component({
  selector: 'app-quickfolio-news',
  templateUrl: './quickfolio-news.component.html',
  styleUrls: ['./quickfolio-news.component.scss']
})
export class QuickfolioNewsComponent implements OnInit {

  @Input() _parentHubConnection?: HubConnection = undefined;    // this property will be input from above parent container

  testStr = 'QuickfolioNewsComponent.testStr here';

  constructor() { }

  ngOnInit(): void {
    if (this._parentHubConnection != null) {
      this._parentHubConnection.on('quickfNewsOnConnected', (message: string) => {
        console.log('ws: quickfNewsOnConnected arrived: ' + message);
        this.testStr = message;
      });
    }
  }

} // class
