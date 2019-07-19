FROM nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY dist/* /usr/share/nginx/html

COPY config.sh /

RUN chmod +x /config.sh

CMD ["/config.sh"]