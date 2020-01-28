import os
import subprocess
import datetime

preTaskList = os.popen("tasklist").read().splitlines()
preTaskIds = []
for line in preTaskList:
    words = line.split()
    if (len(words)>1):
        idStr = str(words[1])
        if  idStr.isdigit():
            preTaskIds.append(int(words[1]))

# print(len(preTaskIds))

DETACHED_PROCESS = 8
watchPrecess = subprocess.Popen('tsc --watch -p "tsconfig.json"',shell=True, creationflags=DETACHED_PROCESS)

watchTaskID = -1
postTaskList = os.popen("tasklist").read().splitlines()

for line in postTaskList:
    words = line.split()
    if (len(words)>1):
        idStr = str(words[1])
        if  idStr.isdigit():
            if not int(words[1]) in preTaskIds:
                if "node" not in line:
                    continue  
                watchTaskID = int(words[1])
                # print(line)

with open("watchTaskId.txt", "w") as file:
    file.write(datetime.datetime.now().strftime("%Y-%m-%d-%H-%M") + " " + str(watchTaskID))
print(watchTaskID)