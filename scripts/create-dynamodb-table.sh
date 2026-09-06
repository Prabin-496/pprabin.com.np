#!/usr/bin/env bash
# Creates the single DynamoDB table backing flashcards, contact messages and
# voice recordings. Safe to re-run: exits cleanly if the table already exists.
#
#   ./scripts/create-dynamodb-table.sh [table-name] [region]
#
# Stays inside the perpetual free tier (25 GB storage, 25 RCU/WCU). PAY_PER_REQUEST
# is used so an idle table costs nothing.

set -euo pipefail

TABLE="${1:-AnkiFlashcards}"
REGION="${2:-ap-southeast-2}"

if aws dynamodb describe-table --table-name "$TABLE" --region "$REGION" >/dev/null 2>&1; then
  echo "Table '$TABLE' already exists in $REGION — nothing to do."
  exit 0
fi

echo "Creating table '$TABLE' in $REGION ..."
aws dynamodb create-table \
  --table-name "$TABLE" \
  --region "$REGION" \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes '[{
    "IndexName": "GSI1",
    "KeySchema": [
      {"AttributeName":"GSI1PK","KeyType":"HASH"},
      {"AttributeName":"GSI1SK","KeyType":"RANGE"}
    ],
    "Projection": {"ProjectionType":"ALL"}
  }]' \
  >/dev/null

echo "Waiting for '$TABLE' to become ACTIVE ..."
aws dynamodb wait table-exists --table-name "$TABLE" --region "$REGION"
echo "Done. Set ANKI_TABLE_NAME=$TABLE and AWS_REGION_ANKI=$REGION."
