#!/bin/sh

# Install curl if not available
apk add --no-cache curl

BLAZE_URL="http://blaze:8080/fhir"
BUNDLE_DIR="fhir-bundles"

echo "Starting to upload FHIR bundles to $BLAZE_URL"

# Upload all JSON files
echo "Uploading JSON bundles..."
for file in "$BUNDLE_DIR"/*.json; do
  if [ -f "$file" ]; then
    echo "Uploading $file"
    curl -X POST -H "Content-Type: application/fhir+json" -d @"$file" "$BLAZE_URL"
    echo ""
  fi
done

# Upload all XML files
echo "Uploading XML bundles..."
for file in "$BUNDLE_DIR"/*.xml; do
  if [ -f "$file" ]; then
    echo "Uploading $file"
    curl -X POST -H "Content-Type: application/fhir+xml" -d @"$file" "$BLAZE_URL"
    echo ""
  fi
done

echo "Upload complete!"
