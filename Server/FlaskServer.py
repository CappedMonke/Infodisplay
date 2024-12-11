import argparse
from Settings import settings, set_setting
from flask import Flask, render_template, request
from flask_socketio import SocketIO
from ContentManager import ContentManager


# ---------------------------------------------------------------------------- #
#                                Initializations                               #
# ---------------------------------------------------------------------------- #
app = Flask(__name__, static_folder='Static', template_folder='Templates')
app.config['SECRET_KEY'] = 'This should be set in environment variable'
socketio = SocketIO(app)

content_manager = ContentManager()


# ---------------------------------------------------------------------------- #
#                              Info display routes                             #
# ---------------------------------------------------------------------------- #
@app.route('/')
def render_show_content():
    content = content_manager.get_content_list_as_dict()
    return render_template('ShowContent.html', content=content)


# ---------------------------------------------------------------------------- #
#                              Add content routes                              #
# ---------------------------------------------------------------------------- #
@app.route('/add_content')
def render_add_content():
    return render_template('AddContent.html')


@app.route('/add_content', methods=['POST'])
def add_content():
    content_data = {
        'type': request.form['type'],
        'title': request.form['title'],
        'duration': request.form['duration'],
        'content': request.form['content']
    }
    content_manager.create_and_add_content(content_data)


# ---------------------------------------------------------------------------- #
#                             Manage content routes                            #
# ---------------------------------------------------------------------------- #
@app.route('/manage_content')
def render_manage_content():
    return render_template('ManageContent.html')


@app.route('/edit_content')
def edit_content():
    id = request.args.get('id')
    content = content_manager.get_content_as_dict_by_id(id)
    return render_template('AddContent.html', content = content)


@app.route('/set_visibility', methods=['POST'])
def set_visibility():
    id = request.args.get('id')
    is_visible = request.args.get('is_visible')
    content_manager.set_visibility_by_id(id, is_visible)
    return 'Visibility set', 200


@app.route('/delete_content', methods=['POST'])
def delete_content():
    id = request.args.get('id')
    content_manager.delete_content_by_id(id)
    return 'Content deleted', 200


@app.route('/change_order', methods=['POST'])
def change_order():
    id_list = request.args.get('id_list')
    content_manager.change_order(id_list)
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

    socketio.run(app, host=server_host, port=server_port, debug=debug)