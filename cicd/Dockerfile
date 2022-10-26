# For use only with GitHub Actions cicd
# For local dev please use Dockerfile at root of project
FROM nginx:stable-alpine

COPY dist/* /usr/share/nginx/html

# copy staged files
COPY cicd/stage-release/ /

ENTRYPOINT ["entrypoint.sh"]
