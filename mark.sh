#!/bin/bash

# send a marker to Honeycomb for the current time

USAGE="USAGE: ./mark.sh <message>"

if [ ! -e .env ]
then
  echo "Can't find .env file. Please run from project root"
fi

source ./.env

sha=$(git rev-parse HEAD)

if [ -z "$1" ]
then
  echo $USAGE
  exit 1
fi

MESSAGE=$*

echo "Dataset: $HONEYCOMB_DATASET"
echo "Current SHA: " $sha

# this creates a deploy marker in Honeycomb

curl https://api.honeycomb.io/1/markers/$HONEYCOMB_DATASET -X POST  \
    -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY"  \
    -d "{\"message\":\"$MESSAGE\", \"type\":\"deploy\"}"
