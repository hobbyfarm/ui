#!/bin/bash
sed -i "s/#####HF_SERVER#####/$HF_SERVER/g" /usr/share/nginx/html/main*.*.js
echo "Configured with HF_SERVER=$HF_SERVER"
nginx -g 'daemon off;' # overriding nginx default startup