from datetime import datetime
from moviepy import VideoFileClip
import requests
from Settings import get_setting
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
        
        # If people have their birthday today, rotate person displayed
        if self.is_visible:
            self.current_index = (self.current_index + 1) % len(self.birthday_indices)

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
        

# content['location'] = Berlin
# content['latitude'] = 0
# content['longitude'] = 0
# content['last_update'] = '2000-01-01T00:00:00'
# content['weather'] = {'daily_weather_code': 0, 'temperature_2m_max': 0, ...}
class WeatherContent(BaseContent):
    def __init__(self, type, title, duration, content):
        super().__init__(type, title, duration, content)

        # Fetch coordinates if not provided
        if content.get('latitude') is None or content.get('longitude') is None:
            self.fetch_coordinates()

        self.fetch_weather()


    def update(self):
        # If last_update is older than the update interval, fetch weather
        now = datetime.now()
        if now > datetime.fromisoformat(self.content['last_update']) + get_setting('weather_update_interval') * 60:
            self.fetch_weather()
            return True
        
        return False


    def fetch_coordinates(self):
        # Fetch coordinates of location
        geocode_url = f"https://geocoding-api.open-meteo.com/v1/search?name={self.content['location']}&count=10&language=en&format=json"
        response = requests.get(geocode_url)

        # Set coordinates if successfully fetched
        if response.status_code == 200:
            data = response.json()
            if data['results']:
                self.content['latitude'] = data['results'][0]['latitude']
                self.content['longitude'] = data['results'][0]['longitude']
                self.is_visible = True
                return
        
        # Hide content if coordinates could not be fetched
        print('\033[91mCould not fetch coordinates\033[0m')
        self.is_visible = False


    def fetch_weather(self):
        self.content['last_update'] = datetime.now().isoformat()

        # Fetch weather from open-meteo.com
        weather_url = f'https://api.open-meteo.com/v1/forecast?latitude={self.content['latitude']}&longitude={self.content['longitude']}&current=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FBerlin'
        response = requests.get(weather_url)

        # Set and show content if successfully fetched, else hide content
        if response.status_code == 200:
            data = response.json()
            self.content['weather'] = data
            self.is_visible = True
            return
        
        print('\033[91mCould not fetch weather\033[0m')
        self.is_visible = False


# content['query'] = 'Hello World'
# content['last_update'] = '2000-01-01T00:00:00'
# content = ['articles'] = [{'title': 'Hello World!', 'description': 'This is a description.', 'url': 'https://example.com', 'urlToImage': 'image.png'}, ...]
class NewsContent(BaseContent):
    def __init__(self, type, title, duration, content):
        super().__init__(type, title, duration, content)
        self.current_index = 0
        self.fetch_news()
    

    def update(self):
        # If last_update is older than the update interval, fetch news
        now = datetime.now()
        if now > datetime.fromisoformat(self.content['last_update']) + get_setting('news_update_interval') * 60:
            self.fetch_news()
            return True
        
        # If news could be fetched, rotate news displayed
        if self.is_visible:
            self.current_index = (self.current_index + 1) % len(self.content['articles'])

        return False

    
    def fetch_news(self):
        self.content['last_update'] = datetime.now().isoformat()

        # Fetch news from newsapi.org
        url = f"https://newsapi.org/v2/everything?q={self.content['query']}&language=de&pageSize={get_setting('news_count_items')}&apiKey={get_setting('news_api_key')}"
        response = requests.get(url)

        # Set and show content if successfully fetched, else hide content
        if response.status_code == 200:
            articles = response.json()['articles']
            if articles:
                self.content['articles'] = articles
                self.is_visible = True
                return
        
        # Hide content if news could not be fetched
        print('\033[91mCould not fetch news\033[0m')
        self.is_visible = False


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