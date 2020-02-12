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
  isToolSelectionVisible = false;
  toolSelectionMsg = 'Click red arrow in toolbar! isToolSelectionVisible is set to ' + this.isToolSelectionVisible;
  activeTool = 'MarketHealth';

  // called after Angular has initialized all data-bound properties before any of the view or content children have been checked. Handle any additional initialization tasks.
  ngOnInit() {
    console.log('Sq: ngOnInit()');
    this.onSetTheme('light');
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
        textColor = '#aaaaaa';
        break;
    }
    document.body.style.setProperty('--bgColor', bgColor);
    document.body.style.setProperty('--textColor', textColor);
    console.log('Sq: set theme.');
  }

  onClickToolSelection() {
    this.isToolSelectionVisible = !this.isToolSelectionVisible;
    this.toolSelectionMsg = 'Click red arrow in toolbar! isToolSelectionVisible is set to ' + this.isToolSelectionVisible;
  }

  onChangeActiveTool(tool: string) {
    if (this.activeTool === tool) {
      return;
    }
    this.activeTool = tool;
  }
}
