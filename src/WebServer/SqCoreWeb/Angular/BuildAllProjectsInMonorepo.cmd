call npm run build -- MarketDashboard --prod
call npm run build -- HealthMonitor --prod

cd dist
FOR /D /r %%D in ("*") DO (
    Echo We found folder %%~nxD
    cd %%D
    for %%F in (*) do (
        set "fpath=%%~fF"
        set "fname=%%~nF"
        set "fext=%%~xF"
        set "ISBROTLINEEDED="
        IF "%%~xF" == ".js" set ISBROTLINEEDED=1
        IF "%%~xF" == ".json" set ISBROTLINEEDED=1
        IF "%%~xF" == ".xml" set ISBROTLINEEDED=1
        IF "%%~xF" == ".css" set ISBROTLINEEDED=1
        IF "%%~xF" == ".html" set ISBROTLINEEDED=1
        IF "%%~xF" == ".txt" set ISBROTLINEEDED=1

        IF defined ISBROTLINEEDED (
            Echo Brotli-ing: %%F [%%~xF]
            "brotli.exe" "%%F" --best --force --verbose
        )
    )
    cd ..
)
cd ..