#!/bin/bash

# List of files to remove
files=(
    "/etc/systemd/system/AutostartBrowser.service"
    "/etc/systemd/system/AutostartGestureRecognition.service"
    "/etc/systemd/system/AutostartServer.service"
)

# Iterate through each file and remove it
for file in "${files[@]}"; do
    if [ -e "$file" ]; then
        echo "Removing $file..."
        sudo rm -f "$file"
    else
        echo "File $file does not exist, skipping."
    fi
done

# Reload systemd to reflect the changes
echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "Done!"