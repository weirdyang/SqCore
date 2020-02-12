import { Component, OnInit } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

@Component({
  selector: 'app-market-health',
  templateUrl: './market-health.component.html',
  styleUrls: ['./market-health.component.scss']
})
export class MarketHealthComponent implements OnInit {

  // http://localhost:4202/hub/exsvpush/negotiate?negotiateVersion=1 404 (Not Found), because it is not served on port 4202
  private _hubConnection: HubConnection = new HubConnectionBuilder().withUrl('/hub/exsvpush').build();
  // private _hubConnection: HubConnection = new HubConnectionBuilder().withUrl('https://localhost:5001/hub/exsvpush').build();

  pctChgQQQ = '0.54%';

  constructor() { }

  ngOnInit(): void {
    this._hubConnection
      .start()
      .then(() => {
        console.log('Connection started!');
        this._hubConnection.send('startStreaming', 'message body')  // Error: Cannot send data if the connection is not in the 'Connected' State.
          .then(() => console.log('Connection sent message!'));
      })
      .catch(err => console.log('Error while establishing connection :('));

    this._hubConnection.on('priceQuoteFromServer', (message: string) => {
      console.log('Stream Message arrived:' + message);
      this.pctChgQQQ = message;
      // if (spanStream != null) {
      //   spanStream.innerHTML = `<span>${message}</span>`;      // this is not really single quote('), but (`), which allows C# like string interpolation.
      // }
    });
  }

}
