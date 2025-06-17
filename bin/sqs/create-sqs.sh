#!/bin/bash

env="$1"

if [ "$env" == "development" ]
then
  aws sqs create-queue --queue-name ignite-market-worker-queue-dev-dlq --attributes file://worker-sqs-dev-dlq.json --region us-east-1 --profile ignite
  aws sqs create-queue --queue-name ignite-market-worker-queue-dev --attributes file://worker-sqs-dev.json  --region us-east-1 --profile ignite
elif [ "$env" == "production" ]
then
  aws sqs create-queue --queue-name ignite-market-worker-queue-prod-dlq --attributes file://worker-sqs-prod-dlq.json --region us-east-1 --profile ignite
  aws sqs create-queue --queue-name ignite-market-worker-queue-prod --attributes file://worker-sqs-prod.json  --region us-east-1 --profile ignite
else
  echo "Invalid environment specified. Use 'development' or 'production'."
  exit 1
fi
