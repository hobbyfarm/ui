# Contributing

## Local Development

To modify Angular environment variables for your local environment, copy `src/environments/environment.local.example.ts` to `src/environments/environment.local.ts` and update variables as needed.

- `environment.server` - points to gargantua server

The default behavior requires running a local copy of [k3d via hf-k3d](https://github.com/hobbyfarm/hobbyfarm) and a local copy of [gargantua](https://github.com/hobbyfarm/gargantua). In this case, the default user is:

- Username: `admin`
- Password: `admin`

### via Angular server

```
npm install
npm run start:local
```

The Angular server will start a watch loop and listen on [localhost:4200](http://localhost:4200).

### via docker-compose

```
# start the stack
./compose-up.sh

# -- or --
# start the stack, building changes to local dev container
# only needed if a file in ./cicd/docker-local has changed
./compose-up.sh --build
```

`./compose-up.sh` does the following:

- calls `docker-compose up`
  - creates or starts the `hf-ui` container, runs `npm install` and starts the Angular Server, re-builds on change, and listens on [localhost:16200](http://localhost:16200)

If `pakcages.json` has changed, stop and restart the `docker-compose` stack so that `npm install` runs inside the Docker container again

To modify `docker-compose` variables for your local environment, copy `.env.example` to `.env` and update variables as needed.
