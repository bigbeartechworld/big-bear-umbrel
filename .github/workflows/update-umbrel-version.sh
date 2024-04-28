#!/bin/bash

# Enhanced version update script for umbrel-app.yml
# This script dynamically adjusts based on the application name

app_name=$1

# Path to the specific application's configuration file
file="$app_name/umbrel-app.yml"

# Check if the specific application's file exists
if [[ -f "$file" ]]; then
    current_version=$(grep 'version:' $file | awk '{print $2}')
    echo "Current version for $app_name: $current_version"

    # Increment the patch version number
    IFS='.' read -ra ADDR <<< "$current_version"
    v1=${ADDR[0]}
    v2=${ADDR[1]}
    v3=$((ADDR[2] + 1))

    new_version="$v1.$v2.$v3"
    sed -i "s/version: .*/version: $new_version/" $file
    echo "Updated version for $app_name to $new_version"
else
    echo "Error: Configuration file for $app_name does not exist."
fi
