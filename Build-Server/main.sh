#!/bin/bash
set -e  # exit on error

# Ensure repo URL is provided
if [ -z "$GIT_REPOSITORY__URL" ]; then
  echo "❌ Error: GIT_REPOSITORY__URL is not set"
  exit 1
fi

# Clean old output if exists
rm -rf /home/app/output

# Clone repository
echo "🔄 Cloning repository: $GIT_REPOSITORY__URL"
git clone "$GIT_REPOSITORY__URL" /home/app/output

# Run the Node script
echo "🚀 Running script.js"
exec node script.js
