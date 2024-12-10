from datetime import datetime
from moviepy import VideoFileClip
import Settings
import os
import uuid


UPLOADS_FOLDER = 'Static/Uploads'
IMAGES_FOLDER = f'{UPLOADS_FOLDER}/Images'
VIDEOS_FOLDER = f'{UPLOADS_FOLDER}/Videos'
SLIDESHOWS_FOLDER = f'{UPLOADS_FOLDER}/Slideshows'
PDFS_FOLDER = f'{UPLOADS_FOLDER}/PDFs'
EXCELS_FOLDER = f'{UPLOADS_FOLDER}/Excels'
GAMES_FOLDER = f'{UPLOADS_FOLDER}/Games'


class BaseContent():
    def __init__(self, type, title, duration, content, is_visible=True, id=None):
        self.type = type
        self.title = title
        self.duration = duration
        self.content = content
        self.is_visible = is_visible
        self.id = id

        if id is None:
            self.id = str(uuid.uuid4())


    def get_subclass(type):
        for subclass in BaseContent.__subclasses__():
            if subclass.__name__ == type:
                return subclass
        raise ValueError('Content type not found')


    # This method is called when the content is shown
    # Use it for updating the content (e.g. fetching new data)
    def update(self):
        return False # Return false if content is not updated


    # This method is called when the content is deleted
    def delete_associated_files(self):
        pass


# content['html'] = '<p>This is <b>bold</b>, <i>italic</i>, and <span style='color: red;'>red</span> text.</p>'
class TextContent(BaseContent):
    def __init__(self, type, title, duration, content):
        super().__init__(type, title, duration, content)


# content['file'] = 'image.png'
class ImageContent(BaseContent):
    def __init__(self, type, title, duration, content):
        super().__init__(type, title, duration, content)
    

    def delete_associated_files(self):
        os.remove(f'{IMAGES_FOLDER}/{self.content['file']}')


# content['html'] = '<p>This is <b>bold</b>, <i>italic</i>, and <span style='color: red;'>red</span> text.</p>'
# content['file'] = 'image.png'
class ImageTextContent(BaseContent):
    def __init__(self, type, title, duration, content):
        super().__init__(type, title, duration, content)
    

    def delete_associated_files(self):
        os.remove(f'{IMAGES_FOLDER}/{self.content['file']}')


# content['file'] = 'video.mp4'
class VideoContent(BaseContent):
    def __init__(self, type, title, duration, content):
        # If a new VideoContent is created, get duration of the video
        if duration == 0:
            clip = VideoFileClip(f'{VIDEOS_FOLDER}/{self.content['file']}')
            clip.close()
            duration = clip.duration

        super().__init__(type, title, duration, content)


    def delete_associated_files(self):
        os.remove(f'{VIDEOS_FOLDER}/{self.content['file']}')


# content['folder'] = 'slideshow_folder'
# content['duration_per_image'] = 0
class SlideshowContent(BaseContent):
    def __init__(self, type, title, duration, content):
        filenames = []

        # Collect all image filenames in the folder
        for filename in os.listdir(f'{SLIDESHOWS_FOLDER}/{content['folder']}'):
            if filename.endswith('.png', '.jpg', '.jpeg', '.gif'):
                filenames.append(filename)
        
        if duration == 0:
            duration = content['duration_per_image'] * len(filenames)
        
        super().__init__(type, title, duration, content)

    
    def delete_associated_files(self):
        folder_path = f'{SLIDESHOWS_FOLDER}/{self.content['folder']}'
        os.rmdir(folder_path)


# content['file'] = 'document.pdf'
class PDFContent(BaseContent):
    def __init__(self, type, title, duration, content):
        super().__init__(type, title, duration, content)
    

    def delete_associated_files(self):
        os.remove(f'{PDFS_FOLDER}/{self.content['file']}')


# content['file'] = 'document.xlsx'
class ExcelContent(BaseContent):
    def __init__(self, type, title, duration, content):
        super().__init__(type, title, duration, content)
    

    def delete_associated_files(self):
        os.remove(f'{EXCELS_FOLDER}/{self.content['file']}')


# content['items'] = [{'text': 'Hello World!', 'date': '2000-01-01'}, ...]
class ProgramContent(BaseContent):
    def __init__(self, type, title, duration, content):
        super().__init__(type, title, duration, content)


# content['people'] = [{'name': 'John Doe', 'birthday': '2000-01-01', 'image': 'image.png'}, ...]
class BirthdayContent(BaseContent):
    def __init__(self, type, title, duration, content):
        super().__init__(type, title, duration, content)
        self.birthday_indices = []
        self.current_index = 0
        self.setup_birthdays()
    

    def update(self):
        # If last_update is not today, setup birthdays
        if datetime.fromisoformat(self.content['last_update']).day != datetime.now().day:
            self.setup_birthdays()
            return True
        
        self.rotate_person_displayed()
        return False


    def delete_associated_files(self):
        for person in self.content['people']:
            file_path = f'{IMAGES_FOLDER}/{person["image"]}'
            # Because the image is optional, check if it exists
            if os.path.exists(file_path):
                os.remove(file_path)


    def setup_birthdays(self):
        now = datetime.now()
        self.content['last_update'] = now.isoformat()

        # Get indices of people who have their birthday today
        for i, person in enumerate(self.content['people']):
            birthday = datetime.fromisoformat(person['birthday'])
            if birthday.month == now.month and birthday.day == now.day:
                self.birthday_indices.append(i)

        # If no birthdays today, hide content
        if self.birthday_indices:
            self.is_visible = True
        else:
            self.is_visible = False

    
    # This method is called when multiple people have their birthday today
    def rotate_person_displayed(self):
        if self.birthday_indices:
            self.current_index = (self.current_index + 1) % len(self.birthday_indices)


class WeatherContent(BaseContent):
    def __init__(self, type, title, duration, content):
        super().__init__(type, title, duration, content)


# content = {'articles': [{'title': 'Hello World!', 'description': 'This is a description.', 'url': 'https://example.com', 'urlToImage': 'image.png'}, ...]}
class NewsContent(BaseContent):
    def __init__(self, type, title, duration, content):
        super().__init__(type, title, duration, content)
        self.current_index = 0
    

    def update(self):
        self.rotate_news_displayed()
        
        now = datetime.now()
        if now > datetime.fromisoformat(self.content['last_update']) + Settings.NEWS_UPDATE_INTERVAL:
            self.fetch_news()
            return True
        # Fetch new news

    

    def fetch_news(self):
        pass


    def rotate_news_displayed(self):
        self.current_index = (self.current_index + 1) % len(self.content['articles'])


# content['folder'] = 'FlappyBird'
# content['html'] = 'FlappyBird.html'
class GameContent(BaseContent):
    def __init__(self, type, title, duration, content):
        super().__init__(type, title, duration, content)

        # Find the html in the folder if not provided
        if content.get('html') is None:
            for file in os.listdir(f'{GAMES_FOLDER}/{content['folder']}'):
                if file.endswith('.html'):
                    content['html'] = file
                    break


    def delete_associated_files(self):
        folder_path = f'{GAMES_FOLDER}/{self.content['folder']}'
        os.rmdir(folder_path)