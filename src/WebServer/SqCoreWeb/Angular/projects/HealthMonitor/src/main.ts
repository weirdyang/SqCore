import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));


// function getGreeting() {
//   // let x = 'bela';
//   // x = 'bela2';
//   return 'howdy';
// }

// function greeter(person) {
//   let user2 = 'Jane User';
//   return "Hello, " + person;
// }
