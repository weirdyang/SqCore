import os
import subprocess


#os.system("brotli.exe ")
#p = subprocess.call(r'c:\windows\system32\brotli.exe ')
#print (p)


#import brotli

os.system("npm run build -- MarketDashboard --prod")
os.system("npm run build -- HealthMonitor --prod")

#os.system("d:\temp\letoltes\broli.exe")

#print(os.environ['COMSPEC'])
#FNULL = open(os.devnull, 'w')    #use this if you want to suppress output to stdout from the subprocess
#os.chdir("c:/windows/system32")
#subprocess.call(["brotli.exe",""],  shell=True)
#subprocess.call(["c:/windows/system32/brotli.exe", "--best"], shell=True)
workDir = os.getcwd()

for dir in os.walk("dist"):
	print("directory"+dir[0])
	os.chdir(dir[0])
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
			print ("!!!!!!!!!!!!      brotli  !!!!!!!!!!")
			os.system(r"c:/windows/system32/brotli.exe")
	os.chdir(workDir)