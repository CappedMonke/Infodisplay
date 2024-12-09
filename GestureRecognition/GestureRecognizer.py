import requests
import cv2
import mediapipe as mp
import argparse
from GestureImplementations import analyze_multi_hand_landmarks, multi_frame_state_handler
from colorama import Fore, Style


# This class handles the gesture recognition.
# First it reads the camera frames and processes them by utilizing the cv2 library.
# Then it uses the Mediapipe library to detect hands.
# Finally it checks for gestures defined in GestureImplementations.py file.
# If a gesture is recognized, it sends the gestures name to the server.


class GestureRecognizer:
    def __init__(self, server_host, server_port, skip_frames, debug):
        self.server_host = server_host
        self.server_port = server_port
        self.skip_frames = skip_frames + 1
        self.debug = debug
        self.frame_count = 0
        self.cap = cv2.VideoCapture(0) # Open the default camera
        self.hands = mp.solutions.hands.Hands(max_num_hands=2) # Initialize the hands module


    def run(self):
        while True:
            self.process_frame()
            if cv2.waitKey(1) == 27: # ESC key
                break

        # Release resources
        self.cap.release()
        cv2.destroyAllWindows()


    def process_frame(self):
        # Read frame from camera
        success, frame = self.cap.read()
        if not success:
            print(Fore.RED + "Could not read frame from camera." + Style.RESET_ALL)
            return

        # Increase frame count
        self.frame_count += 1

        # Skip frames
        if self.frame_count % self.skip_frames != 0:
            return

        # Convert frame from BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process the frame with the hands module
        frame_result = self.hands.process(rgb_frame)
        multi_hand_landmarks = frame_result.multi_hand_landmarks

        # If hands are detected, analyze the hand data
        if multi_hand_landmarks:
            gesture_result = analyze_multi_hand_landmarks(multi_hand_landmarks)
            # Send gesture name to server
            # Gestures are always sent, even if no gesture was recognized because some services might want to know that no gesture was recognized
            # requests.post(f"http://{self.server_host}:{self.server_port}/receive_gesture/{gesture_result.gesture_name}")

            if self.debug:
                # Draw gesture name on frame
                if gesture_result.was_gesture_recognized:
                    cv2.putText(frame, gesture_result.gesture_name, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)

                # For each detected hand draw hand landmarks and connections
                for hand_landmarks in multi_hand_landmarks:
                    mp.solutions.drawing_utils.draw_landmarks(frame, hand_landmarks, mp.solutions.hands.HAND_CONNECTIONS)
        else:
            # Increase dropout count
            multi_frame_state_handler.increase_dropout_count_all()

        # Render frame to screen
        if self.debug:
            cv2.imshow("GestureRecognizer", frame)


if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("--server-host", type=str, default="localhost", required=True, help="Host of the server.")
    parser.add_argument("--server-port", type=int, default=5000, required=True, help="Port of the server.")
    parser.add_argument("--skip-frames", type=int, default=0, help="Number of frames to skip. This will result in better performance but higher latency.")
    parser.add_argument("--debug", type=bool, default=False, help="Enable debug mode.")
    args = parser.parse_args()

    server_host = args.server_host
    server_port = args.server_port
    skip_frames = args.skip_frames
    debug = args.debug

    recognizer = GestureRecognizer(server_host, server_port, skip_frames, debug)
    recognizer.run()
