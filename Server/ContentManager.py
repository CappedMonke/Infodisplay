import os
from flask import json
from ContentTypes import BaseContent


CONTENT_FILE_PATH = 'Server/Savestate/Content.json'


class ContentManager():
    def __init__(self):
        self.content_list = []
        self.load_content()
        self.save_content() # Some content gets updated on initialization, so save it again immediately
    

    def load_content(self):
        # Create empty content file if it doesn't exist
        if not os.path.exists(CONTENT_FILE_PATH):
            with open(CONTENT_FILE_PATH, 'w') as file:
                json.dump([], file)

        # Check if file is empty
        if os.path.getsize(CONTENT_FILE_PATH) == 0:
            return
        
        with open(CONTENT_FILE_PATH, 'r') as file:
            content_data_list = json.load(file)
            for content_data in content_data_list:
                self.create_and_add_content(**content_data)
    
    
    def save_content(self):
        content_data_list = self.get_content_list_as_dict()

        # Add content to list
        with open(CONTENT_FILE_PATH, 'w') as file:
            json.dump(content_data_list, file)


    def create_and_add_content(self, **content_data):
        content_class = BaseContent.get_subclass(type)
        content = content_class(**content_data)
        self.add_content(content)


    def get_content_as_dict_by_id(self, id):
        content = self.get_content_by_id(id)
        return content.__dict__


    def get_content_list_as_dict(self):
        content_dict_list = []
        for content in self.content_list:
            content_dict_list.append(content.__dict__)
        return content_dict_list


    def get_content_by_id(self, id):
        for content in self.content_list:
            if content.id == id:
                return content
        return None


    def add_content(self, content):
        does_content_exist = self.get_content_by_id(content.id)

        # If content with same id doesn't exist, add it
        if not does_content_exist:
            self.content_list.append(content)

        # If content with same id exists, replace it
        else:
            existing_content_index = self.content.index(content)
            existing_content = self.content_list[existing_content_index]
            existing_content.delete_associated_files()
            existing_content = content
       
        self.save_content()
    
    def add_content_by_id(self, id, content):
        content = self.get_content_by_id(id)
        self.add_content(content)
    

    def delete_content(self, content):
        content.delete_associated_files()
        self.content_list.remove(content)
        self.save_content()

    def delete_content_by_id(self, id):
        content = self.get_content_by_id(id)
        self.delete_content(content)
    

    def set_content_visibility(self, content, is_visible):
        content.set_visibility(is_visible)
        self.save_content()

    def set_visibility_by_id(self, id, is_visible):
        content = self.get_content_by_id(id)
        self.set_content_visibility(content, is_visible)


    def change_order(self, id_list):
        new_content_list = []
        for id in id_list:
            content = self.get_content_by_id(id)
            new_content_list.append(content)
        self.content_list = new_content_list
        self.save_content()