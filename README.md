# HobbyFarm User Interface

This is the user interface for HobbyFarm - an interactive learning system.

This is meant to be used in conjunction with github.com/hobbyfarm/gargantua.

## BUILD

    docker image build . -t hobbyfarm/ui

## RUN

    docker container run -it -p 80:80 -e HF_SERVER=api.training.example.com hobbyfarm/ui

