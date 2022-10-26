##### sdk image #####
FROM node:lts-alpine3.10 AS sdk

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:prod


###### release image #####
FROM nginx:stable-alpine

COPY --from=sdk /app/dist/* /usr/share/nginx/html

# copy staged files
COPY cicd/docker/stage-release/ /

ENTRYPOINT ["entrypoint.sh"]
