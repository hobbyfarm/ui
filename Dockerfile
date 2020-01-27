FROM node:13.1.0-alpine3.10 as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN $(npm bin)/ng build --prod --aot


FROM nginx:1.17.6-alpine

COPY --from=build /app/dist/* /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY entrypoint.sh /
RUN chmod +x /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
