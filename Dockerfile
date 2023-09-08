##### sdk image #####
FROM node:lts-alpine3.18 AS sdk

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build:prod

###### release image #####
FROM nginx:stable-alpine

COPY --from=sdk /app/dist/* /usr/share/nginx/html

# copy staged files
COPY .docker/stage-release/ /

RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
