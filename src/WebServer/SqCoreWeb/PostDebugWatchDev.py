import os
import platform
import time
import socket

print("SqBuild: Python ver: " + platform.python_version() + " (" + platform.architecture()[0] + "), CWD:'" + os. getcwd() + "'")
if (os.getcwd().endswith("SqCore")) : # VsCode's context menu 'Run Python file in Terminal' runs it from the workspace folder. VsCode F5 runs it from the project folder. We change it to the project folder
    os.chdir(os.getcwd() + "/src/WebServer/SqCoreWeb")

print("SqBuild: KILL the PreDebug (F5) Watch process manually now. Later this Python code will try to send a message to the other Python processes (file polling or IP port) to terminate themselves.")
clientsocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
clientsocket.connect(('localhost', 8389))
clientsocket.send(bytes('hello', 'UTF-8'))