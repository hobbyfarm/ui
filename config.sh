#!/bin/bash
echo -e "\n\nwindow.HobbyfarmConfig = { SERVER: '${HOBBYFARM_SERVER}', SERVER_HOSTNAME: '${HOBBYFARM_SERVER_HOSTNAME}' } " >> /usr/share/nginx/html/main.js
cat config.js
nginx -g 'daemon off;' # overriding nginx default startup