#!/bin/bash

docker compose down --volumes
docker compose pull
docker compose up
docker compose down --volumes
