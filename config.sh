#!/bin/bash
echo -e "{\"server\": \"${HOBBYFARM_SERVER}\"}" > /usr/share/nginx/html/env.json
cat config.js
nginx -g 'daemon off;' # overriding nginx default startup