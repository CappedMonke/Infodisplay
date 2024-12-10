import argparse
from flask import Flask, render_template
from flask_socketio import SocketIO
from ContentManager import ContentManager
from GameManager import GameManager


# ---------------------------------------------------------------------------- #
#                                Initializations                               #
# ---------------------------------------------------------------------------- #
app = Flask(__name__, static_folder='Static', template_folder='Templates')
app.config['SECRET_KEY'] = 'This should be set in environment variable'
socketio = SocketIO(app)

content_manager = ContentManager()
game_manager = GameManager()


# ---------------------------------------------------------------------------- #
#                              Info display routes                             #
# ---------------------------------------------------------------------------- #
@app.route('/')
def render_infodisplay():
    return render_template('InfoDisplay.html')


@app.route('/show_previous_content', methods=['POST'])
def show_previous_content():
    return 'Previous content shown'


@app.route('/show_next_content', methods=['POST'])
def show_next_content():
    return 'Next content shown'


@app.route('/toggle_freeze', methods=['POST'])
def toggle_freeze():
    return 'Freeze toggled'


@app.route('/receive_gesture/<gesture>')
def receive_gesture(gesture):
    return 'Gesture received'


# ---------------------------------------------------------------------------- #
#                              Add content routes                              #
# ---------------------------------------------------------------------------- #
@app.route('/add_content')
def render_add_content():
    return render_template('AddContent.html')


@app.route('/add_post', methods=['POST'])
def add_post():
    return 'Post added'


# ---------------------------------------------------------------------------- #
#                             Manage content routes                            #
# ---------------------------------------------------------------------------- #
@app.route('/manage_content')
def render_manage_content():
    return render_template('ManageContent.html')


@app.route('/edit_content/<id>')
def edit_content(id):
    return 'Content edited'


@app.route('/set_visibility/<id>/<visibility>', methods=['POST'])
def set_visibility(id, visibility):
    return 'Visibility set'


@app.route('/delete_content/<id>', methods=['POST'])
def delete_content(id):
    return 'Content deleted'


@app.route('/change_order/<id_list>', methods=['POST'])
def change_order(id_list):
    return 'Order changed'


# ---------------------------------------------------------------------------- #
#                                Settings routes                               #
# ---------------------------------------------------------------------------- #
@app.route('/settings')
def render_settings():
    return render_template('Settings.html')


if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('--server-host', type=str, default='localhost', required=True, help='Host of the server.')
    parser.add_argument('--server-port', type=int, default=5000, required=True, help='Port of the server.')
    parser.add_argument('--debug', type=bool, default=False, help='Enable debug mode.')
    args = parser.parse_args()

    server_host = args.server_host
    server_port = args.server_port
    debug = args.debug

    socketio.run(app, host=server_host, port=server_port, debug=debug)