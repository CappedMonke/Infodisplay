import json
import os


SETTINGS_FILE_PATH = 'Server/Savestate/Settings.json'


settings = {
    'weather_update_interval': 60, # 1 hour
    'news_update_interval': 60 * 2, # 2 hours
    'news_api_key': '',
    'news_count_items': 5
}


def load_settings():
    if not os.path.exists(SETTINGS_FILE_PATH):
        save_settings()
        return
    
    with open(SETTINGS_FILE_PATH, 'r') as file:
        settings.update(json.load(file))
    

def save_settings():
    with open(SETTINGS_FILE_PATH, 'w') as file:
        json.dump(settings, file, indent=4)


def get_setting(key):
    return settings[key]


def set_setting(key, value):
    settings[key] = value
    save_settings()


# Load settings when this module is imported
load_settings()