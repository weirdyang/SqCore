import os
import platform
import subprocess
from threading import Thread
import time
import sys

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
    sys.exit("BuildDevPreDebug.py checks /node_modules in parallel. And we don't want that both processes start to download that huge folder. Exit now. It only happens once per year.")
    # os.system("npm install")
    # Path(nodeTouchFile).touch()

# # 2. DotNet (C#) build DEBUG
# os.system("dotnet build --configuration Debug SqCoreWeb.csproj /property:GenerateFullPaths=true")


# What can Debug user watch: wwwrootGeneral (NonWebpack), ExampleCsServerPushInRealtime (Webpack), HealthMonitor (Angular), MarketDashboard (Angular)

def threaded_function(commandStr):
     print("Executing in separate thread: " + commandStr)
     os.system(commandStr)    # works like normal, loads ./tsconfig.json, which contains "include": ["wwwroot"]. 
     #processObj = subprocess.run("tsc --watch", shell=True, stdout=subprocess.PIPE)  # This will run the command and return any output into process.output

# 3.1 Non-Webpack webapps in ./wwwroot/webapps should be transpiled from TS to JS
#os.system("tsc --watch")    # works like normal, loads ./tsconfig.json, which contains "include": ["wwwroot"]. 
#subprocess.run(["tsc", "--watch"], stdout=subprocess.PIPE) # This will run the command and return any output
#subprocess.run("tsc --watch", shell=True, stdout=subprocess.PIPE)
#subprocess.run("tsc --watch", shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)  # This will run the command and return any output
thread1 = Thread(target = threaded_function, args = ("tsc --watch",))
thread1.start()  #thread1.join()


# 3.2 Webpack webapps in ./webapps should be packed (TS, CSS, HTML)
# Webpack: 'Multiple output files' are not possible and out of scope of webpack. You can use a build system.
thread2 = Thread(target = threaded_function, args = ("npx webpack --config webapps/ExampleCsServerPushInRealtime/webpack.config.js --mode=development --watch",))
thread2.start()  #thread2.join()


# # 4. Wait for Python message to terminate all threads.
print("User break (Control-C, or closing CMD) is expected. Or Wait and Watch Port communication from another Python thread to ending this thread.")
time.sleep(5)   # 5 sec waiting time
print("Main thread exits now, but those additional threads (processObj = subprocess.run()) still running. Kill them somehow.")
# #quit()
sys.exit()  # these doesn't kill the started threads, so you should program killing the threads separately.

# TODO: 1. As a first thread sleep() here 
# time.sleep(5)   # 5 sec
# then prove that threads can be killed. Program a logic that gets the thread1... and kills their process. 
# By either killing the thread OR taking processObj = subprocess.run() and send Control-C to it OR killing processOjb

# TODO: 2. instead of sleep(), before killing the threads, wait for a message from another Python program. Ideally 
# > some inteprocess communication (named semaphor) OR
# > listening via IP port OR
# > deleting a time-stamp file and polling every 1-2 seconds if it is created. Whenewer that file IsExist() terminate threads. File watching is the slowest. 
# example before: if os.path.isfile(nodeTouchFile):
