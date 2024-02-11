#!/bin/bash

# Set the environment variables
export GIT_REPOSITORY__URL="$GIT_REPOSITORY__URL"

# Clone the repository
git clone "$GIT_REPOSITORY__URL" /home/app/output

# Run the script
exec node script.js