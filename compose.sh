#!/bin/sh -e

cd $(dirname $0)

build_arg=""
script="$0"

up_usage() {
cat >&2 <<EOF
start HobbyFarm UI

    usage: $script up <options>

options:
        --build  - build new container
    -h, --help   - print this message

EOF
}

up() {
    while test $# -gt 0
    do
        case "$1" in
            -h | --help)
                up_usage
                exit 0
                ;;
            --build)
                build_arg="--build"
                ;;
            *)
                up_usage
                exit 1
                ;;
        esac
        shift
    done

    docker-compose up $build_arg
}

stop() {
    docker-compose stop
}

destroy() {
    docker-compose down -v
}

usage() {
cat >&2 <<-EOF
manage local HobbyFarm UI development environment

        usage: $script <options> <command>

where <command> is one of:

    up          - create or start UI
    stop        - stop UI
    destroy     - destroy UI

options:
    -h, --help  - print this message

EOF
}

case "$1" in
    -h | --help)
        usage
        exit 0
        ;;
    up)
        shift
        up "$@"
        ;;
    stop)
        stop
        ;;
    destroy)
        destroy
        ;;
    *)
        usage
        exit 1
        ;;
esac
