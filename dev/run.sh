#!/bin/bash

cd $(dirname "$0")

docker compose down --volumes
docker compose pull
docker compose up
docker compose down --volumes
