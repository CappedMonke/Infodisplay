#!/bin/bash


# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color (reset)


# Function to detect the package manager of OS
detect_package_manager() {
    if command -v apt >/dev/null ; then
        echo "apt"
    elif command -v pacman >/dev/null ; then
        echo "pacman"
    else
        echo "unsupported package manager"
    fi
}


# Function to check and install Vivaldi browser if not installed
install_vivaldi() {
    if ! command -v vivaldi >/dev/null ; then
        echo "Vivaldi browser is not installed. Installing it now..."
        case $(detect_package_manager) in
            apt)
                wget -qO- https://repo.vivaldi.com/archive/linux_signing_key.pub | sudo gpg --dearmor -o /usr/share/keyrings/vivaldi-browser-keyring.gpg
                sudo apt update
                sudo apt install -y vivaldi-stable
                ;;
            pacman)
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


# Function to create a virtual environment and install requirements
install_requirements() {
    local req_file=$1
    local dir_path=".venv"

    if [ ! -d "$dir_path" ]; then
        echo "Creating virtual environment..."
        python3 -m venv "$dir_path"
    else
        echo "Virtual environment already exists."
    fi

    echo "Installing requirements from $req_file..."
    source "$dir_path/bin/activate"
    pip install --upgrade pip
    pip install -r "$req_file"
    deactivate
}


# Function to install a service
install_service() {
    local service_name=$1
    local custom_message=$2
    local source_file="Services/$service_name"
    local dest_file="/etc/systemd/system"

    if [ -e "$source_file" ]; then
        echo -e "${BLUE}$custom_message (y/n)${NC}"
        read -r answer
        if [[ "$answer" == "y" ]]; then
            case "$service_name" in
                "AutostartBrowser.service")
                    install_vivaldi
                    ;;
                "AutostartGestureRecognition.service")
                    install_requirements "GestureRecognition/Requirements.txt"
                    ;;
                "AutostartServer.service")
                    install_requirements "Server/Requirements.txt"
                    ;;
            esac

            echo "Copying $service_name to $dest_file..."
            sudo cp "$source_file" "$dest_file"
        fi
    else
        echo "File $service_name not found in $SOURCE_DIR. Skipping."
    fi
    echo
}


install_service "AutostartBrowser.service" "Do you want to automatically start the browser and open the website at system boot? Installs Vivaldi browser if not already installed."
install_service "AutostartGestureRecognition.service" "Do you want to automatically start the camera to recognize gestures at system boot? This will not work if no camera is connected."
install_service "AutostartServer.service" "Do you want to automatically start the server at system boot? Usually you would do this for only one device in the network."

echo -e "${GREEN}Installation completed! To undo the installation, run Clean.sh. Do you want to reboot the system now for the changes to take effect? (y/n)${NC}"
read -r answer
if [[ "$answer" == "y" ]]; then
    sudo reboot
fi