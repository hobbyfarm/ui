# HobbyFarm User Interface

![Main](https://github.com/hobbyfarm/ui/workflows/Main/badge.svg?branch=master)
![docker version latest](https://img.shields.io/docker/v/hobbyfarm/ui?color=green&label=latest%20version&sort=semver)

This is the user interface for HobbyFarm - an interactive learning system.

This is meant to be used in conjunction with github.com/hobbyfarm/gargantua.

## Configuration

A file placed at `/config.json` will allow for runtime configuration (e.g., custom logos, themes, etc.).

```json
{
    "title": "Old MacDonald's Farm",
    "favicon": "/assets/default/favicon.png",
    "login": {
        "logo": "/assets/default/rancher-labs-stacked-color.svg",
        "background": "/assets/default/login_container_farm.svg"
    },
    "logo": "/assets/default/logo.svg"
}
```

To customize logos, mount them into the container at `/usr/share/nginx/html/assets`, and then reference the file names in `config.json`. 

## Contributing

If you're interested in contributing, see [CONTRIBUTING.md](CONTRIBUTING.md)
