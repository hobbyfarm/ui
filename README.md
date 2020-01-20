# HobbyFarm User Interface

This is the user interface for HobbyFarm - an interactive learning system.

This is meant to be used in conjunction with github.com/hobbyfarm/gargantua.

## Configuration

A file placed at `/config.json` will allow for runtime configuration (e.g., custom logos, themes, etc.).

```json
{
  "title": "Old MacDonald's Farm",
  "favicon": "<base64-encoded image>",
  "logo": "<base64-encoded image>",
  "login": {
    "logo": "<base64-encoded image>",
    "background": "<base64-encoded image>"
  }
}
```
## BUILD

    docker image build . -t hobbyfarm/ui

## RUN

    docker container run -it -p 80:80 -e HF_SERVER=api.training.example.com hobbyfarm/ui

