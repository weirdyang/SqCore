import os
import subprocess
import platform
import sys
from pathlib import Path
import fileinput

print("SqCore build system. Python ver: " + platform.python_version() + " (" + platform.architecture()[0] + "), CWD:'" + os. getcwd() + "'")
if (os.getcwd().endswith("SqCore")) : # VsCode's context menu 'Run Python file in Terminal' runs it from the workspace folder. VsCode F5 runs it from the project folder. We change it to the project folder
    os.chdir(os.getcwd() + "/src/WebServer/SqCoreWeb")

# 1. Basic checks: Ensure Node.js is installed. If node_modules folder is empty, it should restore Npm packages.
nodeTouchFile = os.getcwd() + "/node_modules/.install-stamp"
if os.path.isfile(nodeTouchFile):
    print ("/node_modules/ exist")
else:
    nodeRetCode = os.system("node --version")   # don't want to run 'node --version' all the times. If stamp file exists, assume node.exe is installed
    if (nodeRetCode != 0) :
        sys.exit("Node.js is required to build and run this project. To continue, please install Node.js from https://nodejs.org/")
    os.system("npm install")
    Path(nodeTouchFile).touch()

# 2. Non-Webpack webapps in ./wwwroot/webapps should be transpiled from TS to JS
os.system("tsc")    # works like normal, loads ./tsconfig.json, which contains "include": ["wwwroot"]. 

# 3. Webpack webapps in ./webapps should be packed (TS, CSS, HTML)
# npm install -D clean-webpack-plugin css-loader html-webpack-plugin mini-css-extract-plugin ts-loader typescript webpack webpack-cli
# Webpack: 'Multiple output files' are not possible and out of scope of webpack. You can use a build system.
print("Executing 'npx webpack --mode=production'")
os.system("npx webpack --config webapps/ExampleCsServerPushInRealtime/webpack.config.js --mode=production")

# 4. Angular webapps in  ./Angular should be built
# forget them at the moment. Recreate Angular apps with new Angular version.

# 5. Brotli-ing text (HTML, JS, CSS) files in wwwroot.
print ("!!!!!!!!!!!! Brotli-ing text files... (brotli(x64).exe runs only in Python x64) !!!!!!!!!!")
for dir in os.walk("wwwroot"):
    # print("directory: " + dir[0])
    for file in dir[2]:
        fileName = os.path.splitext(file)
        fileExt = fileName[1]
        # normal (non-debug) user should not downoald TS, MAP files, so don't increase the footprint by brotling them.
        if (fileExt == ".html" or fileExt == ".js" or fileExt == ".css" or fileExt == ".json" or fileExt == ".xml" or fileExt == ".txt"):
            print("Brotli-ing: " + dir[0] + "\\" + fileName[0] + fileExt)
            os.system("c:/windows/system32/brotli.exe " +dir[0]+ "/" + file + ' --best --force --verbose')

# 5. DotNet (C#) build RELEASE and Publish
os.system("dotnet publish --configuration Release SqCoreWeb.csproj /property:GenerateFullPaths=true")

# 6. Postprocess the published folder. 
# NLog.config: fileName="${basedir}/../../../../../../logs/SqCoreWeb.${date:format=yyyy-MM-dd}.sqlog" should be changed to fileName="${basedir}/../logs/SqCoreWeb.${date:format=yyyy-MM-dd}.sqlog"
# This should not be done in the local Debug or Release folders, only the Publish folder.
with fileinput.FileInput("bin/Release/netcoreapp3.1/publish/NLog.config", inplace=True, backup='.bak') as file:
    for line in file:
        print(line.replace("{basedir}/../../../../../../logs", "{basedir}/../logs"), end='')
