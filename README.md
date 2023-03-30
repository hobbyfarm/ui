# HobbyFarm User Interface

[![CI](https://github.com/hobbyfarm/ui/actions/workflows/ci.yaml/badge.svg?branch=master)](https://github.com/hobbyfarm/ui/actions/workflows/ci.yaml)
[![PKG](https://github.com/hobbyfarm/ui/actions/workflows/pkg.yaml/badge.svg?branch=master)](https://github.com/hobbyfarm/ui/actions/workflows/pkg.yaml)
[![Docker Image Version (latest semver)](https://img.shields.io/docker/v/hobbyfarm/ui?label=Latest&sort=semver)](https://hub.docker.com/r/hobbyfarm/ui)

This is the web user interface for [HobbyFarm](https://github.com/hobbyfarm), an interactive learning system.

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

To customize logos, mount them into the container at `/usr/share/nginx/html/assets`, and then reference the file names in `config.json`. Alternatively, you can reference files from an object store.

A file placed at `/custom.css` will allow for runtime style customization. To do so, mount a file called `custom.css` into the container at `/usr/share/nginx/html/`.

## Contributing

## Code Style

This project uses [Prettier](https://prettier.io/) for code formatting and [ESLint](https://eslint.org/) to enforce further code style guidelines. We recommend you install appropriate extensions for your preferred editor or IDE so that you can catch problems early.

While code style conformance is checked during CI, you can also run these checks beforehand using the commands `npm run prettier:check` and `npm run lint`. Run `npm run prettier:format` to format all source files in this repository using Prettier.

### Local Development

To modify Angular configuration for your local environment, copy `src/environments/environment.local.example.ts` to `src/environments/environment.local.ts` and update the variables as needed. This is particulary useful for `environment.server`, to match your local gargantua server URL.

This web application needs gargantua (backend) to be working, look at [gargantua](https://github.com/hobbyfarm/gargantua/blob/master/CONTRIBUTING.md) for more information. The default authentification is admin/admin.

Execute from a terminal:

```bash
npm install
npm run start:local
```

The Angular server will start a watch loop and listen on [localhost:4200](http://localhost:4200).
