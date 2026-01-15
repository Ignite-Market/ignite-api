#!/bin/bash
set -e

FUNCTION_NAME="api-proxy-${ENV}"

# Build environment variables JSON in the correct format: {"Variables":{"Key":"Value"}}
# Note: AWS_REGION is automatically set by Lambda, so we don't include it
# Use jq to properly escape JSON values (handles special characters, quotes, etc.)
if command -v jq &> /dev/null; then
  echo "Using jq to build environment variables JSON"
  ENV_VARS=$(jq -n \
    --arg api_keys_s3_bucket "${API_KEYS_S3_BUCKET}" \
    --arg api_keys_decrypted_s3_key "${API_KEYS_DECRYPTED_S3_KEY:-api-keys/decrypted-keys.json}" \
    --arg api_proxy_key "${API_PROXY_KEY}" \
    --arg rapid_api_key "${RAPID_API_KEY}" \
    --arg api_mappings "${API_MAPPINGS}" \
    --arg api_proxy_cache_ttl "${API_PROXY_CACHE_TTL:-30}" \
    --arg mysql_host "${MYSQL_HOST:-}" \
    --arg mysql_port "${MYSQL_PORT:-3306}" \
    --arg mysql_user "${MYSQL_USER:-}" \
    --arg mysql_password "${MYSQL_PASSWORD:-}" \
    --arg mysql_database "${MYSQL_DATABASE:-}" \
    '{
      Variables: {
        API_KEYS_S3_BUCKET: $api_keys_s3_bucket,
        API_KEYS_DECRYPTED_S3_KEY: $api_keys_decrypted_s3_key,
        API_PROXY_KEY: $api_proxy_key,
        RAPID_API_KEY: $rapid_api_key,
        API_MAPPINGS: $api_mappings,
        API_PROXY_CACHE_TTL: $api_proxy_cache_ttl,
        MYSQL_HOST: $mysql_host,
        MYSQL_PORT: $mysql_port,
        MYSQL_USER: $mysql_user,
        MYSQL_PASSWORD: $mysql_password,
        MYSQL_DATABASE: $mysql_database
      }
    }')
else
  # Fallback: Use Python to properly escape JSON (Python is usually available)
  echo "Using Python3 to build environment variables JSON (jq not available)"
  ENV_VARS=$(python3 -c "
import json
import os
env_vars = {
    'Variables': {
        'API_KEYS_S3_BUCKET': os.environ.get('API_KEYS_S3_BUCKET', ''),
        'API_KEYS_DECRYPTED_S3_KEY': os.environ.get('API_KEYS_DECRYPTED_S3_KEY', 'api-keys/decrypted-keys.json'),
        'API_PROXY_KEY': os.environ.get('API_PROXY_KEY', ''),
        'RAPID_API_KEY': os.environ.get('RAPID_API_KEY', ''),
        'API_MAPPINGS': os.environ.get('API_MAPPINGS', ''),
        'API_PROXY_CACHE_TTL': os.environ.get('API_PROXY_CACHE_TTL', '30'),
        'MYSQL_HOST': os.environ.get('MYSQL_HOST', ''),
        'MYSQL_PORT': os.environ.get('MYSQL_PORT', '3306'),
        'MYSQL_USER': os.environ.get('MYSQL_USER', ''),
        'MYSQL_PASSWORD': os.environ.get('MYSQL_PASSWORD', ''),
        'MYSQL_DATABASE': os.environ.get('MYSQL_DATABASE', '')
    }
}
print(json.dumps(env_vars))
")
fi

# Check if function exists by checking exit code
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "${AWS_REGION}" >/dev/null 2>&1; then
  echo "Function exists, updating code..."
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://api-proxy.zip \
    --region "${AWS_REGION}"
  
  # Wait for the code update to complete before updating configuration
  echo "Waiting for code update to complete..."
  aws lambda wait function-updated \
    --function-name "$FUNCTION_NAME" \
    --region "${AWS_REGION}"
  
  echo "Updating function configuration..."
  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --handler "index.handler" \
    --environment "${ENV_VARS}" \
    --region "${AWS_REGION}" || echo "Warning: Failed to update function configuration"
else
  echo "Function does not exist, creating new function..."
  echo "Debug: Looking for function: $FUNCTION_NAME in region: ${AWS_REGION}"
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs20.x \
    --role "${LAMBDA_ROLE_ARN}" \
    --handler index.handler \
    --zip-file fileb://api-proxy.zip \
    --timeout 30 \
    --memory-size 128 \
    --environment "${ENV_VARS}" \
    --region "${AWS_REGION}" \
    --tags "project=ignite-market,env=${ENV},component=api-proxy"
fi