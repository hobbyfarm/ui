# Requires GitHub Actions cicd
# For local dev please use Dockerfile in project root
FROM nginx:stable-alpine

COPY dist/* /usr/share/nginx/html

# copy staged files
COPY cicd/stage-release/ /

ENTRYPOINT ["entrypoint.sh"]
