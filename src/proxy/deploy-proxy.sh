#!/bin/bash
set -e

FUNCTION_NAME="api-proxy-${ENV}"
FUNCTION_EXISTS=$(aws lambda get-function --function-name $FUNCTION_NAME --region ${AWS_REGION} 2>&1 || echo "NOT_FOUND")

if echo "$FUNCTION_EXISTS" | grep -q "NOT_FOUND\|ResourceNotFoundException"; then
  echo "Function does not exist, creating new function..."
  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs20.x \
    --role ${LAMBDA_ROLE_ARN} \
    --handler api-proxy.handler \
    --zip-file fileb://api-proxy.zip \
    --timeout 30 \
    --memory-size 128 \
    --environment Variables="{API_KEYS_S3_BUCKET=${API_KEYS_S3_BUCKET},API_KEYS_DECRYPTED_S3_KEY=${API_KEYS_DECRYPTED_S3_KEY:-api-keys/decrypted-keys.json},API_PROXY_KEY=${API_PROXY_KEY},RAPID_API_KEY=${RAPID_API_KEY},API_MAPPINGS=${API_MAPPINGS},API_PROXY_CACHE_TTL=${API_PROXY_CACHE_TTL:-30},AWS_REGION=${AWS_REGION}}" \
    --region ${AWS_REGION} \
    --tags "project=ignite-market,env=${ENV},component=api-proxy"
else
  echo "Function exists, updating code..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://api-proxy.zip \
    --region ${AWS_REGION}
  
  echo "Updating function configuration..."
  aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment Variables="{API_KEYS_S3_BUCKET=${API_KEYS_S3_BUCKET},API_KEYS_DECRYPTED_S3_KEY=${API_KEYS_DECRYPTED_S3_KEY:-api-keys/decrypted-keys.json},API_PROXY_KEY=${API_PROXY_KEY},RAPID_API_KEY=${RAPID_API_KEY},API_MAPPINGS=${API_MAPPINGS},API_PROXY_CACHE_TTL=${API_PROXY_CACHE_TTL:-30},AWS_REGION=${AWS_REGION}}" \
    --region ${AWS_REGION} || echo "Warning: Failed to update function configuration"
fi

