#!/bin/bash
# Create a screen with a name and in detached mode
screen -S "SqCoreWeb" -d -m
# Send the command to be executed on your screen
# The $ before the command is to make the shell parse the \n inside the quotes, and the newline is required to execute the command (like when you press enter).
screen -r "SqCoreWeb" -X stuff $'cd /home/sq-vnc-client/SQ/WebServer/SqCoreWeb/published/publish\ndotnet SqCoreWeb.dll\n'
#
#this is how to kill a session
#screen -X -S "SqCoreWeb" quit
#
# Then run 'crontab -e' and insert this:
## run SqCore web server 20 sec after reboot
#@reboot sleep 20 && /home/sq-vnc-client/SQ/admin/start-sqcoreweb-in-screen.sh

