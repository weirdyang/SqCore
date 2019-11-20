import os
import subprocess
#import platform
#print("Python version: " + platform.python_version() + " (" + platform.architecture()[0] + ")")

os.system("npm run build -- MarketDashboard --prod")
os.system("npm run build -- HealthMonitor --prod")

print ("!!!!!!!!!!!! Brotli-ing text files... (brotli(x64).exe runs only in Python x64) !!!!!!!!!!")
for dir in os.walk("dist"):
	print("directory: "+dir[0])
	for file in dir[2]:
		fileSplit = os.path.splitext(file)
		brotliNeeded = 0
		if (fileSplit[1] == ".js"):
			brotliNeeded = 1
		if (fileSplit[1] == ".json"):
			brotliNeeded = 1
		if (fileSplit[1] == ".xml"):
			brotliNeeded = 1
		if (fileSplit[1] == ".css"):
			brotliNeeded = 1
		if (fileSplit[1] == ".html"):
			brotliNeeded = 1
		if (fileSplit[1] == ".txt"):
			brotliNeeded = 1
		if (brotliNeeded == 1):
			print (fileSplit)
#			print ("!!!!!!!!!!!!      brotli(x64).exe (it runs only in Python x64) !!!!!!!!!!")
			os.system(r"c:/windows/system32/brotli.exe " +dir[0]+ '/' + file + " --best --force --verbose")
