#!/bin/bash
echo -e "\n\nwindow.HobbyfarmConfig = { SERVER: '${HOBBYFARM_SERVER}' } " >> /usr/share/nginx/html/main.js
cat config.js
nginx -g 'daemon off;' # overriding nginx default startup