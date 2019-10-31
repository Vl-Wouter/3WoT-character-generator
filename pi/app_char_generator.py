'''
Avatar Loop Server w/ Firebase
-------------------------------------
Server to read updates on a loop signal and loop through created avatars
-------------------------------------
Author: Vl-Wouter
Modified: 31-10-2019
'''

import requests
import threading
import time
from flask import Flask
import firebase_admin
from firebase_admin import credentials, firestore
from sense_hat import SenseHat
import json
from random import randint

# Create instance of Flask
app = Flask(__name__)

# Create instance of SenseHat
sense = SenseHat()

# Create instance of Firebase
cred = credentials.Certificate("serviceAccount.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Function to show avatar on Sense LED Matrix
def show_avatar_on_sense(array) :
    fillColor = randint(128,255), randint(128,255), randint(128,255)
    for index, row in enumerate(array) :
        for colindex, col in enumerate(row) :
            if(col == 1) :
                sense.set_pixel(index, colindex, fillColor)

# Function to loop through all current avatars
def loop_avatars():
    print('getting avatars from db')
    avatars = db.collection(u'avatars').get()
    for avatar in avatars:
        avatar_data = avatar.to_dict()
        avatar_array = json.loads(avatar_data['array'])
        show_avatar_on_sense(avatar_array)
        time.sleep(1)
        sense.clear()
    # Set loop status to false
    db.collection(u'piConnection').document(u'loopAvatars').set({
        u'isLooping': False
    })

# Callback function for listener
def on_snapshot(doc_snapshot, changes, read_time):
    print(u'Received document snapshot: {}'.format(doc_snapshot[0].id))
    signal_doc = doc_snapshot[0]
    signal_data = signal_doc.to_dict()
    if(signal_data['isLooping'] == True):
        print('Looping through avatars')
        loop_avatars()
    else:
        print('Stopped looping')

# Activate listener thread
@app.before_first_request
def activate_listener():
    def run_listener():
        db.collection(u'piConnection').document(u'loopAvatars').on_snapshot(on_snapshot)
    thread = threading.Thread(target=run_listener)
    thread.daemon = True
    thread.start()

@app.route('/')
def hello_there():
    return 'General Kenobi!'

def start_runner():
    def start_loop():
        not_started = True
        while not_started:
            print('Running start loop')
            try:
                r = requests.get('http://192.168.0.206:8081')
                if r.status_code == 200:
                    print('{}: Server started - quitting start loop'.format(r.status_code))
                    not_started = False
            except:
                print('Server not started')
            time.sleep(2)
    print('Runner started')
    thread = threading.Thread(target=start_loop)
    thread.daemon = True
    thread.start()

if __name__ == '__main__':
    start_runner()
    app.run(host='192.168.0.206', port= 8081, debug = True, use_reloader=False)
