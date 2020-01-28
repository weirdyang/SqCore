import os
import os.path
from datetime import datetime
watchTaskId = -1
filename = "watchTaskId.txt" 
if os.path.isfile(filename):
    with open(filename, "r") as file:
        line = file.read()
        words = line.split()
        if len(words)>1:
            idStr = str(words[1])
            datetimeWatchTask = datetime.strptime(words[0], "%Y-%m-%d-%H-%M")
            difference = datetime.now() - datetimeWatchTask
            if (difference.total_seconds()<3600*24):  #one day
                watchTaskId = int(words[1])

if (watchTaskId>=0):
    os.remove(filename)
    os.system('taskkill /f /PID '+str(watchTaskId))
# else:
#     tmp = os.popen("tasklist").read()

#     for line in tmp.splitlines():
#         if "node" not in line:
#             continue    

