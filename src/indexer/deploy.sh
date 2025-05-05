#!/bin/bash

# Make sure that deploy.env file exists with the following variables:

# AWS_REGION=
# ECR_REPO=
# IMAGE_TAG=
# CONTAINER_NAME=

set -a
source "$(dirname "$0")/deploy.env"
set +a

echo "Logging into AWS ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REPO"

echo "Pulling image $ECR_REPO:$IMAGE_TAG..."
docker pull "$ECR_REPO:$IMAGE_TAG"

echo "Stopping and removing existing container (if any)..."
docker stop "$CONTAINER_NAME" || true
docker rm "$CONTAINER_NAME" || true

echo "Starting new container..."
docker run --env-file .env --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 -d --name "$CONTAINER_NAME" "$ECR_REPO:$IMAGE_TAG"

echo "Pruning all unused images..."
docker image prune -a

echo "Deployment complete."
