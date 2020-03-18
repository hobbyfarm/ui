#!/bin/sh

set -e

trap : TERM INT

(
    echo 'running npm install...'
    npm install
    echo 'starting...'
    npm run start:local:docker
) &

wait
