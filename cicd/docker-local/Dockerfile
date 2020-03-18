FROM node:lts-alpine

# install deps
RUN apk add --no-cache \
        curl

# install fixuid
RUN curl -SsL https://github.com/boxboat/fixuid/releases/download/v0.4/fixuid-0.4-linux-amd64.tar.gz | tar -C /usr/local/bin -xzf - \
    && chown root:root /usr/local/bin/fixuid \
    && chmod 4755 /usr/local/bin/fixuid

# create app dir and set owner
RUN mkdir -p /app/node_modules \
    && chown -R node:node /app

USER node:node

# create npm cache dir
RUN mkdir -p ~/.npm

# copy staged / files
COPY stage/ /

WORKDIR /app
ENTRYPOINT ["fixuid"]
CMD ["run.sh"]
