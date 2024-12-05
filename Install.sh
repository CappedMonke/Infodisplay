#!/bin/bash


SOURCE_DIR="./Services"
DEST_DIR="/etc/systemd/system"


# Function to detect the package manager
detect_package_manager() {
    if command -v apt >/dev/null 2>&1; then
        echo "apt"
    elif command -v pacman >/dev/null 2>&1; then
        echo "pacman"
    else
        echo "unsupported package manager"
    fi
}


# Function to check and install Vivaldi browser if not installed
install_vivaldi() {
    if ! command -v vivaldi >/dev/null 2>&1; then
        echo "Vivaldi browser is not installed. Installing it now..."
        case $(detect_package_manager) in
            apt)
                wget -qO- https://repo.vivaldi.com/archive/linux_signing_key.pub | sudo gpg --dearmor -o /usr/share/keyrings/vivaldi-browser-keyring.gpg
                echo "deb [signed-by=/usr/share/keyrings/vivaldi-browser-keyring.gpg] https://repo.vivaldi.com/archive/deb/ stable main" | sudo tee /etc/apt/sources.list.d/vivaldi.list
                sudo apt update
                sudo apt install -y vivaldi-stable
                ;;
            pacman)
                echo "[vivaldi]" | sudo tee -a /etc/pacman.conf
                echo "SigLevel = Optional TrustAll" | sudo tee -a /etc/pacman.conf
                echo "Server = https://repo.vivaldi.com/arch/stable" | sudo tee -a /etc/pacman.conf
                sudo pacman -Sy --noconfirm vivaldi
                ;;
            *)
                echo "Unsupported package manager. Please install Vivaldi manually."
                exit 1
                ;;
        esac
        echo "Vivaldi browser installed successfully."
    else
        echo "Vivaldi browser is already installed."
    fi
}


# Function to install a service with a custom message
install_service() {
    local service_name=$1
    local custom_message=$2
    local source_file="$SOURCE_DIR/$service_name"
    local dest_file="$DEST_DIR/$service_name"

    if [ -e "$source_file" ]; then
        echo "$custom_message (yes/no)"
        read -r answer
        if [[ "$answer" == "yes" ]]; then
            # Check for Vivaldi installation if the service is AutostartBrowser.service
            if [[ "$service_name" == "AutostartBrowser.service" ]]; then
                install_vivaldi
            fi

            echo "Installing $service_name..."
            sudo cp "$source_file" "$dest_file"
            sudo systemctl daemon-reload
        fi
    else
        echo "File $service_name not found in $SOURCE_DIR. Skipping."
    fi
}


install_service "AutostartBrowser.service" "Do you want to automatically start the browser and open the website at system boot? Installs Vivaldi browser if not already installed."
install_service "AutostartGestureRecognition.service" "Do you want to automatically start the camera to recognize gestures at system boot? Will not work if no camera is connected."
install_service "AutostartServer.service" "Do you want to automatically start the server at system boot?"


echo "Installation process completed! To undo the installation, run Clean.sh."