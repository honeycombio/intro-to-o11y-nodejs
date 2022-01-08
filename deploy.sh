#!/bin/bash

source ./.env

sha=$(git rev-parse HEAD)

echo "Dataset: $HONEYCOMB_DATASET"
echo "Current SHA: " $sha

# this creates a deploy marker in Honeycomb

curl https://api.honeycomb.io/1/markers/$HONEYCOMB_DATASET -X POST  \
    -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY"  \
    -d "{\"message\":\"commit $sha\", \"type\":\"deploy\"}"
