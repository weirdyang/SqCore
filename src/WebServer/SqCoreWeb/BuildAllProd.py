import os
import subprocess
import platform
print("Python version: " + platform.python_version() + " (" + platform.architecture()[0] + ")")

# 1. Basic checks: Ensure Node.js is installed. If node_modules folder is empty, it should restore Npm packages.


# 2. Non-Webpack webapps in ./wwwroot/webapps should be transpiled from TS to JS


# 3. Webpack webapps in ./webapps should be packed (TS, CSS, HTML)
# npm install -D clean-webpack-plugin css-loader html-webpack-plugin mini-css-extract-plugin ts-loader typescript webpack webpack-cli
# Webpack: 'Multiple output files' are not possible and out of scope of webpack. You can use a build system.
print("Executing 'npx webpack --mode=production'")
os.system("npx webpack --config webapps/ExampleCsServerPushInRealtime/webpack.config.js --mode=production")


# 4. Angular webapps in  ./Angular should be built


# 5. Brotli-ing text (HTML, JS, CSS) files in wwwroot.

# print ("!!!!!!!!!!!! Brotli-ing text files... (brotli(x64).exe runs only in Python x64) !!!!!!!!!!")
# for dir in os.walk("dist"):
# 	print("directory: "+dir[0])
# 	for file in dir[2]:
# 		fileSplit = os.path.splitext(file)
# 		brotliNeeded = 0
# 		if (fileSplit[1] == ".js"):
# 			brotliNeeded = 1
# 		if (fileSplit[1] == ".json"):
# 			brotliNeeded = 1
# 		if (fileSplit[1] == ".xml"):
# 			brotliNeeded = 1
# 		if (fileSplit[1] == ".css"):
# 			brotliNeeded = 1
# 		if (fileSplit[1] == ".html"):
# 			brotliNeeded = 1
# 		if (fileSplit[1] == ".txt"):
# 			brotliNeeded = 1
# 		if (brotliNeeded == 1):
# 			print (fileSplit)
# #			print ("!!!!!!!!!!!!      brotli(x64).exe (it runs only in Python x64) !!!!!!!!!!")
# 			os.system(r"c:/windows/system32/brotli.exe " +dir[0]+ '/' + file + " --best --force --verbose")


# 5. DotNet (C#) build RELEASE and Publish

        # "command": "dotnet",
        #     "type": "process",
        #     "args": [
        #         "publish",
        #         "--configuration",
        #         "Release",
        #         "${workspaceFolder}/src/WebServer/SqCoreWeb/SqCoreWeb.csproj",
        #         "/property:GenerateFullPaths=true",
        #         "/consoleloggerparameters:NoSummary"
        #     ],

