import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'MarketDashboard';
  version = '0.1.1';
  user = {
    name: 'Anonymous',
    email: 'anonymous@gmail.com'
  };

  // called after Angular has initialized all data-bound properties before any of the view or content children have been checked. Handle any additional initialization tasks.
  ngOnInit() {
    console.log('Sq: ngOnInit()');
    // document.body.style.setProperty('--primary-color', 'green');
    this.onSetTheme('dark');
  }

  onSetTheme(theme: string) {
    let bgColor = '';
    let textColor = '';
    switch (theme) {
      case 'light':
        bgColor = '#ffffff';
        textColor = '#000000';
        break;
      case 'dark':
        bgColor = '#0000ff';
        textColor = '#ffffff';
        break;
    }
    document.body.style.setProperty('--bg-color', bgColor);
    document.body.style.setProperty('--text-color', textColor);
  }
}
