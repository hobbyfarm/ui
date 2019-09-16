FROM nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY dist/* /usr/share/nginx/html

COPY entrypoint.sh /

RUN chmod +x /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]