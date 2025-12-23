#!/bin/bash
set -e

FUNCTION_NAME="api-proxy-${ENV}"

# Build environment variables JSON
ENV_VARS='{"API_KEYS_S3_BUCKET":"'${API_KEYS_S3_BUCKET}'","API_KEYS_DECRYPTED_S3_KEY":"'${API_KEYS_DECRYPTED_S3_KEY:-api-keys/decrypted-keys.json}'","API_PROXY_KEY":"'${API_PROXY_KEY}'","RAPID_API_KEY":"'${RAPID_API_KEY}'","API_MAPPINGS":"'${API_MAPPINGS}'","API_PROXY_CACHE_TTL":"'${API_PROXY_CACHE_TTL:-30}'","AWS_REGION":"'${AWS_REGION}'"}'

# Check if function exists by checking exit code
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "${AWS_REGION}" >/dev/null 2>&1; then
  echo "Function exists, updating code..."
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://api-proxy.zip \
    --region "${AWS_REGION}"
  
  echo "Updating function configuration..."
  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --environment "Variables=${ENV_VARS}" \
    --region "${AWS_REGION}" || echo "Warning: Failed to update function configuration"
else
  echo "Function does not exist, creating new function..."
  echo "Debug: Looking for function: $FUNCTION_NAME in region: ${AWS_REGION}"
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs20.x \
    --role "${LAMBDA_ROLE_ARN}" \
    --handler api-proxy.handler \
    --zip-file fileb://api-proxy.zip \
    --timeout 30 \
    --memory-size 128 \
    --environment "Variables=${ENV_VARS}" \
    --region "${AWS_REGION}" \
    --tags "project=ignite-market,env=${ENV},component=api-proxy"
fi