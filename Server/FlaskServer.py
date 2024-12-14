import argparse
import json
import socket
from Settings import settings, set_setting
from flask import Flask, render_template, request
from ContentManager import ContentManager
from flask_socketio import SocketIO


server_port = None # Will be set in the main function, is needed for the socket.io server


# ---------------------------------------------------------------------------- #
#                                Initializations                               #
# ---------------------------------------------------------------------------- #
app = Flask(__name__, static_folder='Static', template_folder='Templates')
app.secret_key = 'super secret key'
socketio = SocketIO(app, cors_allowed_origins='*')
content_manager = ContentManager()


# ---------------------------------------------------------------------------- #
#                              Info display routes                             #
# ---------------------------------------------------------------------------- #
@app.route('/')
def render_show_content():
    content_list = content_manager.get_content_list_as_dict()
    content = [content for content in content_list if content['is_visible']] # Only visible content in sent to the ShowContent.html 
    private_ip = socket.gethostbyname(socket.gethostname())
    return render_template('ShowContent.html', content=content, socketIoUrl=f'http://{private_ip}:{server_port}')


# ---------------------------------------------------------------------------- #
#                              Add content routes                              #
# ---------------------------------------------------------------------------- #
@app.route('/add_content')
def render_add_content():
    return render_template('AddContent.html')


@app.route('/add_content', methods=['POST'])
def add_content(): 
    # Cant use json because of file uploads
    content_data = {
        'type': request.form.get('type', ''),
        'id': request.form.get('id', ''),
        'title': request.form.get('title', ''),
        'duration': int(request.form.get('duration', 0)),
        'content': {key: value for key, value in request.form.items() if key not in ['id', 'title', 'duration', 'type']},
    }

    # Handle file uploads
    if request.files:
        files_set = set()
        for key in request.files:
            for file in request.files.getlist(key):
                files_set.add(file.filename)
                content_manager.save_file(content_data['id'], file)
        content_data['content']['files'] = list(files_set) if files_set else None

    # Convert nested JSON strings to dictionaries
    for key, value in content_data['content'].items():
        if isinstance(value, str):
            try:
                # Try to parse the string as JSON
                content_data['content'][key] = json.loads(value)
            except json.JSONDecodeError:
                # If it fails, keep the original string
                content_data['content'][key] = value

    content_manager.create_and_add_content(content_data)
    socketio.emit('content_updated', content_manager.get_content_list_as_dict())  # Emit updated content
    return 'Content added', 200


# ---------------------------------------------------------------------------- #
#                             Manage content routes                            #
# ---------------------------------------------------------------------------- #
@app.route('/manage_content')
def render_manage_content():
    content = content_manager.get_content_list_as_dict()
    return render_template('ManageContent.html', content=content)


@app.route('/edit_content')
def edit_content():
    id = request.args.get('id')
    content = content_manager.get_content_as_dict_by_id(id)
    return render_template('EditContent.html', content=content)


@app.route('/update_content', methods=['POST'])
def update_content():
    # Cant use json because of file uploads
    content_data = {
        'id': request.form['id'],
        'title': request.form['title'],
        'duration': int(request.form.get('duration', 0)),
        'content': {key: value for key, value in request.form.items() if key not in ['id', 'title', 'duration']},
    }

    # Get existing files
    if 'files' in request.form:
        existing_files = set(request.form.getlist('files'))
    else:
        existing_files = set()

    # Handle file uploads
    if 'file' in request.files:
        for file in request.files.getlist('file'):
            existing_files.add(file.filename)
            content_manager.save_file(content_data['id'], file)
    
    if existing_files:
        content_data['content']['files'] = list(existing_files)

    for key, value in content_data['content'].items():
        if isinstance(value, str):
            try:
                # Try to parse the string as JSON
                content_data['content'][key] = json.loads(value)
            except json.JSONDecodeError:
                # If it fails, keep the original string
                content_data['content'][key] = value

    content_manager.update_content(content_data)
    socketio.emit('content_updated', content_manager.get_content_list_as_dict())  # Emit updated content
    return 'Content updated', 200


@app.route('/set_visibility', methods=['POST'])
def set_visibility():
    data = request.get_json()
    id = data['id']
    is_visible = data['is_visible']
    content_manager.set_visibility_by_id(id, is_visible)
    return 'Visibility set', 200


@app.route('/delete_content', methods=['POST'])
def delete_content():
    data = request.get_json()
    id = data['id']
    content_manager.delete_content_by_id(id)
    socketio.emit('content_updated', content_manager.get_content_list_as_dict()) 
    return 'Content deleted', 200


@app.route('/change_order', methods=['POST'])
def change_order():
    data = request.get_json()
    id_list = data['id_list']
    content_manager.change_order(id_list)
    socketio.emit('content_updated', content_manager.get_content_list_as_dict()) 
    return 'Order changed', 200


# ---------------------------------------------------------------------------- #
#                                Settings routes                               #
# ---------------------------------------------------------------------------- #
@app.route('/settings')
def render_settings():
    return render_template('Settings.html', settings=settings)


@app.route('/save_settings', methods=['POST'])
def save_settings():
    data = request.form
    for key, value in data.items():
        set_setting(key, value)
    return 'Saved settings', 200
    

# ---------------------------------------------------------------------------- #
#                                     Main                                     #
# ---------------------------------------------------------------------------- #
if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('--server-host', type=str, default='0.0.0.0', help='Host of the server.')
    parser.add_argument('--server-port', type=int, default=5000, help='Port of the server.')
    parser.add_argument('--debug', type=bool, default=False, help='Enable debug mode.')
    args = parser.parse_args()

    server_host = args.server_host
    server_port = args.server_port
    debug = args.debug

    # Run the app with SocketIO
    socketio.run(app, host=server_host, port=server_port, debug=debug)
