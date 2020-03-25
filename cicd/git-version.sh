#!/bin/sh -e

cd $(dirname $0)/../src/environments

export GIT_TAG=$(git tag -l --points-at HEAD)
export GIT_REVISION=$(git rev-parse --short HEAD)

envsubst '${GIT_TAG} ${GIT_REVISION}' \
    < version.ts.template \
    > version.ts
