#!/bin/bash
set -e

cd lambda-package
npm install --production --no-audit --no-fund
zip -r ../api-proxy.zip . -q
cd ..
echo "Package size: $(du -h api-proxy.zip | cut -f1)"