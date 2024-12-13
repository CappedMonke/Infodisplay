from datetime import datetime
from moviepy import VideoFileClip
from Settings import get_setting
import requests


UPLOADS_FOLDER = 'Server/Static/Uploads'


class BaseContent():
    def __init__(self, id, type, title, duration, content, is_visible):
        self.id = id
        self.type = type
        self.title = title
        self.duration = int(duration)
        self.content = content
        self.is_visible = is_visible


    def get_subclass(type):
        for subclass in BaseContent.__subclasses__():
            if subclass.__name__ == type:
                return subclass
        raise ValueError('Content type not found')

    # This method is called when the content is shown
    # Use it for updating the content (e.g. fetching new data)
    def refresh(self):
        return False # Return false if content is not refreshd
    
    def update(self):
        pass


# content['text'] = 'Hello World!'
class TextContent(BaseContent):
    def __init__(self, id, type, title, duration, content, is_visible=True, **kwargs):
        super().__init__(id, type, title, duration, content, is_visible)


# content['file'] = 'image.png'
class ImageContent(BaseContent):
    def __init__(self, id, type, title, duration, content, is_visible=True, **kwargs):
        super().__init__(id, type, title, duration, content, is_visible)
    

# content['text'] = 'Hello World!'
# content['file'] = 'image.png'
class ImageTextContent(BaseContent):
    def __init__(self, id, type, title, duration, content, is_visible=True, **kwargs):
        super().__init__(id, type, title, duration, content, is_visible)


# content['file'] = 'video.mp4'
class VideoContent(BaseContent):
    def __init__(self, id, type, title, duration, content, is_visible=True, **kwargs):
        # If a new VideoContent is created, get duration of the video
        clip = VideoFileClip(f'{UPLOADS_FOLDER}/{id}/{content['files'][0]}')
        duration = clip.duration
        clip.close()
        super().__init__(id, type, title, duration, content, is_visible)

    def update(self):
        # Get duration of the video
        clip = VideoFileClip(f'{UPLOADS_FOLDER}/{self.id}/{self.content['files'][0]}')
        self.duration = clip.duration
        clip.close()


# content['duration_per_image'] = 0
class SlideshowContent(BaseContent):
    def __init__(self, id, type, title, duration, content, is_visible=True, **kwargs):
        duration = int(content['duration_per_image']) * len(content['files'])
        super().__init__(id, type, title, duration, content, is_visible)


# content['file'] = 'document.pdf'
class PdfContent(BaseContent):
    def __init__(self, id, type, title, duration, content, is_visible=True, **kwargs):
        super().__init__(id, type, title, duration, content, is_visible)
    

# content['file'] = 'document.xlsx'
class ExcelContent(BaseContent):
    def __init__(self, id, type, title, duration, content, is_visible=True, **kwargs):
        super().__init__(id, type, title, duration, content, is_visible)
    

# content['items'] = [{'text': 'Hello World!', 'date': '2000-01-01'}, ...]
class ProgramContent(BaseContent):
    def __init__(self, id, type, title, duration, content, is_visible=True, **kwargs):

        # TODO: If show_till_program_is_over is true and we are in the time range of the program, set duration to the time of the last item minus the time of now
        # if content.get('show_till_program_is_over']) and ... == 'true':
        #     pass

        super().__init__(id, type, title, duration, content, is_visible)


# BUG: if visibility was set to false by the user, it will be automatically set to true when someone has their birthday.
# content['people'] = [{'name': 'John Doe', 'birthday': '2000-01-01', 'image': 'image.png'}, ...]
class BirthdayContent(BaseContent):
    def __init__(self, id, type, title, duration, content, is_visible=True, **kwargs):
        super().__init__(id, type, title, duration, content, is_visible)
        self.birthday_indices = []
        self.current_index = 0
        self.setup_birthdays()
    

    def refresh(self):
        # If last_refresh is not today, setup birthdays
        if datetime.fromisoformat(self.content['last_refresh']).day != datetime.now().day:
            self.setup_birthdays()
            return True
        
        # If people have their birthday today, rotate person displayed
        if self.is_visible:
            self.current_index = (self.current_index + 1) % len(self.birthday_indices)

        return False


    def update(self):
        self.setup_birthdays()


    def setup_birthdays(self):
        now = datetime.now()
        self.content['last_refresh'] = now.isoformat()

        # Get indices of people who have their birthday today
        for i, birthday_str in enumerate(self.content['birthdayTable']['birthday']):
            birthday = datetime.fromisoformat(birthday_str)
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
# content['last_refresh'] = '2000-01-01T00:00:00'
# content['weather'] = {'daily_weather_code': 0, 'temperature_2m_max': 0, ...}
class WeatherContent(BaseContent):
    def __init__(self, id, type, title, duration, content, is_visible=True, **kwargs):
        super().__init__(id, type, title, duration, content, is_visible)

        # Fetch coordinates if not provided
        if content.get('latitude') is None or content.get('longitude') is None:
            self.fetch_coordinates()

        self.fetch_weather()


    def refresh(self):
        # If last_refresh is older than the refresh interval, fetch weather
        now = datetime.now()
        if now > datetime.fromisoformat(self.content['last_refresh']) + get_setting('weather_refresh_interval') * 60:
            self.fetch_weather()
            return True
        
        return False


    def update(self):
        self.fetch_coordinates()
        self.fetch_weather()


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
        self.content['last_refresh'] = datetime.now().isoformat()

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
# content['last_refresh'] = '2000-01-01T00:00:00'
# content = ['articles'] = [{'title': 'Hello World!', 'description': 'This is a description.', 'url': 'https://example.com', 'urlToImage': 'image.png'}, ...]
class NewsContent(BaseContent):
    def __init__(self, id, type, title, duration, content, is_visible=True, **kwargs):
        super().__init__(id, type, title, duration, content, is_visible)
        self.current_index = 0
        self.fetch_news()
    

    def refresh(self):
        # If last_refresh is older than the refresh interval, fetch news
        now = datetime.now()
        if now > datetime.fromisoformat(self.content['last_refresh']) + get_setting('news_refresh_interval') * 60:
            self.fetch_news()
            return True
        
        # If news could be fetched, rotate news displayed
        if self.is_visible:
            self.current_index = (self.current_index + 1) % len(self.content['articles'])

        return False


    def update(self):
        self.fetch_news()

    
    def fetch_news(self):
        self.content['last_refresh'] = datetime.now().isoformat()

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


# content['html'] = 'FlappyBird.html'
class GameContent(BaseContent):
    def __init__(self, id, type, title, duration, content, is_visible=True, **kwargs):
        # Find the html in the folder if not provided
        if content.get('html') is None:
            for file in content['files']:
                if file.endswith('.html'):
                    content['html'] = file
                    break

        super().__init__(id, type, title, duration, content, is_visible)