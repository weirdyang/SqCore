REM For Development of many Angular projects (Monorepo). To enjoy that any file modification reloads the browser, only 1 Angular projects should be served. 
REM And it should be tested by visiting http://localhost:4200/ (served by that 'ng serve') and not visiting  https://localhost:5001 (which is served by the the ASP webserver)
REM In Production, everything will be fine. Webpack files will be served by the ASP webserver as static files.

REM cd HealthMonitor (not needed to change CWD, stay in the Angular workspace folder)

REM 'npm install' to update nodejs packages into folder node_modules
call npm install

REM uncomment only one of the next lines. 'npm run start' will turn to 'ng serve' defined in package.json
REM call npm run start -- MarketDashboard --prod
call npm run start -- HealthMonitor