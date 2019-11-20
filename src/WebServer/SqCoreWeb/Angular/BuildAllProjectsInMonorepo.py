import os
import subprocess
#import platform
#print("Python version: " + platform.python_version() + " (" + platform.architecture()[0] + ")")

os.system("npm run build -- MarketDashboard --prod")
os.system("npm run build -- HealthMonitor --prod")

for dir in os.walk("dist"):
	print("directory"+dir[0])
	for file in dir[2]:
		fileSplit = os.path.splitext(file)
		print (fileSplit)
		brotliNeeded = 0
		if (fileSplit[1] == ".js"):
			print ("    found js") 
			brotliNeeded = 1
		if (fileSplit[1] == ".json"):
			print ("    found json") 
			brotliNeeded = 1
		if (fileSplit[1] == ".xml"):
			print ("    found xml") 
			brotliNeeded = 1
		if (fileSplit[1] == ".css"):
			print ("    found css") 
			brotliNeeded = 1
		if (fileSplit[1] == ".html"):
			print ("    found html") 
			brotliNeeded = 1
		if (fileSplit[1] == ".txt"):
			print ("    found txt") 
			brotliNeeded = 1
		if (brotliNeeded == 1):
#			print ("!!!!!!!!!!!!      brotli  !!!!!!!!!!")
			os.system(r"c:/windows/system32/brotli.exe " +dir[0]+ '/' + file + " --best --force --verbose")
