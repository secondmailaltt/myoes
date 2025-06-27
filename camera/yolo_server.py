# # backend/yolo_server.py
# from flask import Flask, Response, request
# from flask_cors import CORS, cross_origin
# import cv2, torch, atexit


# app = Flask(__name__)
# CORS(app)

# # 1) YOLOv5 model load (small variant)
# model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
# model.conf = 0.5   # confidence threshold
# model.iou  = 0.45  # NMS IoU threshold

# # 2) Webcam stream khai do
# cap = cv2.VideoCapture(0)

# def gen_frames():
#     while True:
#         success, frame = cap.read()
#         if not success:
#             break

#         # 3) BGR → RGB aur inference
#         rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         results = model(rgb, size=640)

#         # 4) Bounding boxes draw karo
#         for *box, conf, cls in results.xyxy[0]:
#             x1,y1,x2,y2 = map(int, box)
#             label = results.names[int(cls)]
#             cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
#             cv2.putText(frame, f"{label} {conf:.2f}",
#                         (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 1)

#         # 5) Encode to JPEG & MJPEG stream
#         ret, buf = cv2.imencode('.jpg', frame)
#         frame_bytes = buf.tobytes()
#         yield (b'--frame\r\n'
#                b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# @app.route('/video_feed')
# def video_feed():
#     return Response(gen_frames(),
#                     mimetype='multipart/x-mixed-replace; boundary=frame')

# @app.route('/shutdown', methods=['POST'])
# def shutdown():
#     # Release the camera
#     cap.release()

#     # Shut down Flask server
#     func = request.environ.get('werkzeug.server.shutdown')
#     if func:
#         func()
#     return 'Server shutting down...', 200

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5000, threaded=True)





# # backend/yolo_server.py
# from flask import Flask, Response, request
# from flask_cors import CORS, cross_origin
# import cv2, torch, atexit

# app = Flask(__name__)
# CORS(app)

# # 1) YOLOv5 model load (small variant)
# model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
# model.conf = 0.5   # confidence threshold
# model.iou  = 0.45  # NMS IoU threshold

# # 2) Open webcam
# cap = cv2.VideoCapture(0)

# # Ensure camera is released on process exit
# atexit.register(lambda: cap.release())

# def gen_frames():
#     while True:
#         success, frame = cap.read()
#         if not success:
#             break

#         # 3) BGR → RGB for inference
#         rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         results = model(rgb, size=640)

#         # 4) Draw bounding boxes
#         for *box, conf, cls in results.xyxy[0]:
#             x1, y1, x2, y2 = map(int, box)
#             label = results.names[int(cls)]
#             cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
#             cv2.putText(
#                 frame,
#                 f"{label} {conf:.2f}",
#                 (x1, y1 - 10),
#                 cv2.FONT_HERSHEY_SIMPLEX,
#                 0.5,
#                 (0,255,0),
#                 1
#             )

#         # 5) Encode to JPEG & stream as MJPEG
#         ret, buf = cv2.imencode('.jpg', frame)
#         frame_bytes = buf.tobytes()
#         yield (
#             b'--frame\r\n'
#             b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n'
#         )

# @app.route('/video_feed')
# def video_feed():
#     return Response(
#         gen_frames(),
#         mimetype='multipart/x-mixed-replace; boundary=frame'
#     )

# # NEW: lightweight HTML wrapper so the stream auto-fits your square container
# @app.route('/camera')
# @cross_origin()
# def camera_page():
#     return """
#     <!doctype html>
#     <html>
#       <head>
#         <style>
#           html, body {
#             margin: 0; padding: 0;
#             height: 100%; overflow: hidden;
#             background: black;
#           }
#           img {
#             width: 100%;
#             height: 100%;
#             object-fit: cover;       /* fill the square, cropping as needed */
#             object-position: center; /* center the video */
#           }
#         </style>
#       </head>
#       <body>
#         <img src="/video_feed" alt="camera stream" />
#       </body>
#     </html>
#     """, 200, {'Content-Type': 'text/html'}

# # Shutdown endpoint to release camera and stop server
# @app.route('/shutdown', methods=['POST'])
# def shutdown():
#     cap.release()
#     func = request.environ.get('werkzeug.server.shutdown')
#     if func:
#         func()
#     return 'Server shutting down...', 200

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5000, threaded=True)







# # backend/yolo_server.py
# from flask import Flask, Response, request
# from flask_cors import CORS, cross_origin
# import cv2, torch, atexit
# import numpy as np

# app = Flask(__name__)
# CORS(app)

# # Load YOLOv5s
# model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
# model.conf = 0.5
# model.iou  = 0.45

# # === WARMUP: run one dummy inference to JIT‐compile, load weights, etc. ===
# dummy = np.zeros((640, 640, 3), dtype=np.uint8)  # single black frame
# _ = model(dummy, size=640)                       # throw away the result

# # Open webcam once
# cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

# # Ensure camera is released on process exit
# atexit.register(lambda: cap.release())

# def gen_frames():
#     # If cap was released, reopen it
#     if not cap.isOpened():
#         cap.open(0, cv2.CAP_DSHOW)

#     while True:
#         success, frame = cap.read()
#         if not success:
#             # read failed (maybe cap closed mid-stream) → reopen and retry
#             cap.open(0, cv2.CAP_DSHOW)
#             continue

#         # Inference
#         rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         results = model(rgb, size=640)

#         # Draw boxes
#         for *box, conf, cls in results.xyxy[0]:
#             x1, y1, x2, y2 = map(int, box)
#             label = results.names[int(cls)]
#             cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
#             cv2.putText(
#                 frame,
#                 f"{label} {conf:.2f}",
#                 (x1, y1 - 10),
#                 cv2.FONT_HERSHEY_SIMPLEX,
#                 0.5,
#                 (0,255,0),
#                 1
#             )

#         # MJPEG stream
#         ret, buf = cv2.imencode('.jpg', frame)
#         frame_bytes = buf.tobytes()
#         yield (
#             b'--frame\r\n'
#             b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n'
#         )

# @app.route('/video_feed')
# def video_feed():
#     return Response(
#         gen_frames(),
#         mimetype='multipart/x-mixed-replace; boundary=frame'
#     )

# # Lightweight HTML wrapper for square, cover-fit display
# @app.route('/camera')
# @cross_origin()
# def camera_page():
#     return """
#     <!doctype html>
#     <html>
#       <head>
#         <style>
#           html, body { margin:0; padding:0; height:100%; overflow:hidden; background:black; }
#           img { width:100%; height:100%; object-fit:cover; object-position:center; }
#         </style>
#       </head>
#       <body>
#         <img src="/video_feed" alt="camera stream" />
#       </body>
#     </html>
#     """, 200, {'Content-Type': 'text/html'}

# # Release camera without shutting down server
# @app.route('/release_camera', methods=['POST'])
# def release_camera():
#     try:
#         if cap.isOpened():
#             cap.release()
#     except Exception as e:
#         print('Error releasing camera:', e)
#     return 'Camera released', 200

# # (Optional) full server shutdown
# # @app.route('/shutdown', methods=['POST'])
# # def shutdown():
# #     try:
# #         if cap.isOpened():
# #             cap.release()
# #     except:
# #         pass
# #     func = request.environ.get('werkzeug.server.shutdown')
# #     if func:
# #         func()
# #     return 'Server shutting down...', 200

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5000, threaded=True)
















# # backend/yolo_server.py

# from flask import Flask, Response, request
# from flask_cors import CORS, cross_origin
# import cv2
# import torch
# import atexit
# import numpy as np
# import mediapipe as mp
# import collections
# import threading
# import time
# import requests

# app = Flask(__name__)
# CORS(app)

# # Load YOLOv5s
# model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
# model.conf = 0.5
# model.iou  = 0.45

# # WARMUP: dummy inference
# _dummy = np.zeros((640, 640, 3), dtype=np.uint8)
# _ = model(_dummy, size=640)

# # Open webcam once
# cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
# atexit.register(lambda: cap.release())

# # === MediaPipe face-mesh for eyes ===
# mp_face     = mp.solutions.face_mesh
# face_mesh   = mp_face.FaceMesh(
#     static_image_mode=False,
#     max_num_faces=1,
#     refine_landmarks=True,
#     min_detection_confidence=0.5
# )
# # buffer to hold last 5 sec (~150 frames at 30fps)
# FRAME_BUFFER    = collections.deque(maxlen=150)
# CHEAT_LOCK      = threading.Lock()
# cheated_recently = False

# def eye_aspect_ratio(landmarks, indices):
#     import math
#     pts = [(landmarks[i].x, landmarks[i].y) for i in indices]
#     # horizontal distance
#     A = math.dist(pts[0], pts[3])
#     # vertical distance (avg of two)
#     B = (math.dist(pts[1], pts[5]) + math.dist(pts[2], pts[4])) / 2
#     return B / A if A else 0

# def handle_cheat(student_id, exam_id):
#     global cheated_recently
#     timestamp = int(time.time())
#     clip_name = f"cheat_{timestamp}.mp4"
#     # write buffer to file
#     if FRAME_BUFFER:
#         h, w = FRAME_BUFFER[0].shape[:2]
#         fourcc = cv2.VideoWriter_fourcc(*'mp4v')
#         out = cv2.VideoWriter(clip_name, fourcc, 30, (w, h))
#         for frm in list(FRAME_BUFFER):
#             out.write(frm)
#         out.release()

#     # JWT header use karo
#     headers = {'Authorization': STUDENT_TOKEN}

#     # send clip to backend
#     try:
#         url_upload = 'http://localhost:5000/api/cheats'
#         with open(clip_name, 'rb') as f:
#             files = {'clip': f}
#             data  = {'studentId': student_id, 'examId': exam_id}
#             requests.post(
#               url_upload,
#               files=files,
#               data=data,
#               headers=headers,      # ← yahan add kiya
#               timeout=5
#             )

#         # auto-submit exam via submit-cheat
#         url_submit = f"http://localhost:5000/api/exams/{exam_id}/submit-cheat"
#         requests.post(
#           url_submit,
#           json={'studentId': student_id},
#           headers=headers,        # ← yahan bhi add kiya
#           timeout=5
#         )

#     except Exception as e:
#         print("Cheat handling error:", e)

#     # cooldown
#     time.sleep(10)
#     with CHEAT_LOCK:
#         cheated_recently = False


# def gen_frames(student_id, exam_id):
#     global cheated_recently
#     while True:
#         if not cap.isOpened():
#             cap.open(0, cv2.CAP_DSHOW)
#         success, frame = cap.read()
#         if not success:
#             cap.open(0, cv2.CAP_DSHOW)
#             continue

#         # buffer frame
#         FRAME_BUFFER.append(frame.copy())

#         # MediaPipe detection
#         rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         mp_res = face_mesh.process(rgb)
#         EAR_THRESHOLD = 0.2
#         if mp_res.multi_face_landmarks:
#             lm = mp_res.multi_face_landmarks[0].landmark
#             left  = eye_aspect_ratio(lm, [33, 160, 158, 133, 153, 144])
#             right = eye_aspect_ratio(lm, [263,387,385,362,380,373])
#             if (left < EAR_THRESHOLD or right < EAR_THRESHOLD):
#                 with CHEAT_LOCK:
#                     if not cheated_recently:
#                         cheated_recently = True
#                         threading.Thread(
#                             target=handle_cheat,
#                             args=(student_id, exam_id),
#                             daemon=True
#                         ).start()

#         # YOLOv5 inference & draw
#         results = model(rgb, size=640)
#         for *box, conf, cls in results.xyxy[0]:
#             x1, y1, x2, y2 = map(int, box)
#             label = results.names[int(cls)]
#             cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
#             cv2.putText(
#                 frame,
#                 f"{label} {conf:.2f}",
#                 (x1, y1 - 10),
#                 cv2.FONT_HERSHEY_SIMPLEX,
#                 0.5,
#                 (0,255,0),
#                 1
#             )

#         # MJPEG stream
#         ret, buf = cv2.imencode('.jpg', frame)
#         frame_bytes = buf.tobytes()
#         yield (
#             b'--frame\r\n'
#             b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n'
#         )

# @app.route('/video_feed')
# def video_feed():
#     student_id = request.args.get('student')
#     exam_id    = request.args.get('exam')
#     if not student_id or not exam_id:
#         return "Missing student or exam parameters", 400
#     return Response(
#         gen_frames(student_id, exam_id),
#         mimetype='multipart/x-mixed-replace; boundary=frame'
#     )

# @app.route('/camera')
# @cross_origin()
# def camera_page():
#     return """
#     <!doctype html>
#     <html>
#       <head>
#         <style>
#           html, body { margin:0; padding:0; height:100%; overflow:hidden; background:black; }
#           img { width:100%; height:100%; object-fit:cover; object-position:center; }
#         </style>
#       </head>
#       <body>
#         <img src="/video_feed?student=<STUDENT_ID>&exam=<EXAM_ID>" alt="camera stream" />
#       </body>
#     </html>
#     """, 200, {'Content-Type': 'text/html'}

# @app.route('/release_camera', methods=['POST'])
# def release_camera():
#     try:
#         if cap.isOpened():
#             cap.release()
#     except Exception as e:
#         print('Error releasing camera:', e)
#     return 'Camera released', 200

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5000, threaded=True)














# filhal tak yeh sai tha


# backend/yolo_server.py

# from flask import Flask, Response, request
# from flask_cors import CORS, cross_origin
# import cv2
# import torch
# import atexit
# import numpy as np
# import mediapipe as mp
# import collections
# import threading
# import time
# import requests

# app = Flask(__name__)
# CORS(app)

# # 1) Load YOLOv5s aur warmup
# model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
# model.conf = 0.5
# model.iou  = 0.45
# _dummy = np.zeros((640, 640, 3), dtype=np.uint8)
# _ = model(_dummy, size=640)

# # 2) MediaPipe face-mesh setup
# mp_face   = mp.solutions.face_mesh
# face_mesh = mp_face.FaceMesh(
#     static_image_mode=False,
#     max_num_faces=1,
#     refine_landmarks=True,
#     min_detection_confidence=0.5
# )

# # 3) Frame buffer & cheat lock
# FRAME_BUFFER     = collections.deque(maxlen=150)
# CHEAT_LOCK       = threading.Lock()
# cheated_recently = False

# # 4) Lazy camera handle
# cap = None
# atexit.register(lambda: cap.release() if cap and cap.isOpened() else None)

# # 5) JWT token storage
# STUDENT_TOKEN = None

# # 6) EAR helper
# def eye_aspect_ratio(landmarks, indices):
#     import math
#     pts = [(landmarks[i].x, landmarks[i].y) for i in indices]
#     A = math.dist(pts[0], pts[3])
#     B = (math.dist(pts[1], pts[5]) + math.dist(pts[2], pts[4])) / 2
#     return B / A if A else 0

# # 7) Cheat handler (5s clip + upload + auto-submit)
# def handle_cheat(student_id, exam_id):
#     global cheated_recently
#     ts = int(time.time())
#     clip_name = f"cheat_{ts}.mp4"

#     # Write last 5s buffer to file
#     if FRAME_BUFFER:
#         h, w = FRAME_BUFFER[0].shape[:2]
#         fourcc = cv2.VideoWriter_fourcc(*'mp4v')
#         out = cv2.VideoWriter(clip_name, fourcc, 30, (w, h))
#         for frm in list(FRAME_BUFFER):
#             out.write(frm)
#         out.release()

#     headers = {'Authorization': STUDENT_TOKEN}

#     try:
#         # 1) Upload clip
#         url_up = 'http://localhost:5000/api/cheats'
#         with open(clip_name, 'rb') as f:
#             requests.post(
#                 url_up,
#                 files={'clip': f},
#                 data={'studentId': student_id, 'examId': exam_id},
#                 headers=headers,
#                 timeout=5
#             )
#         # 2) Auto-submit via submit-cheat
#         url_sub = f'http://localhost:5000/api/exams/{exam_id}/submit-cheat'
#         requests.post(
#             url_sub,
#             json={'studentId': student_id},
#             headers=headers,
#             timeout=5
#         )
#     except Exception as e:
#         print("Cheat handling error:", e)

#     # Cooldown 10s
#     time.sleep(10)
#     with CHEAT_LOCK:
#         cheated_recently = False

# # 8) Frame generator
# def gen_frames(student_id, exam_id):
#     global cap, cheated_recently

#     while True:
#         # Lazy open camera
#         if not cap or not cap.isOpened():
#             cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

#         success, frame = cap.read()
#         if not success:
#             cap.release()
#             continue

#         # Buffer frame
#         FRAME_BUFFER.append(frame.copy())

#         # MediaPipe detection
#         rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         mp_res = face_mesh.process(rgb)
#         if mp_res.multi_face_landmarks:
#             lm = mp_res.multi_face_landmarks[0].landmark
#             left  = eye_aspect_ratio(lm, [33,160,158,133,153,144])
#             right = eye_aspect_ratio(lm, [263,387,385,362,380,373])
#             with CHEAT_LOCK:
#                 if (left < 0.2 or right < 0.2) and not cheated_recently:
#                     cheated_recently = True
#                     threading.Thread(
#                         target=handle_cheat,
#                         args=(student_id, exam_id),
#                         daemon=True
#                     ).start()

#         # YOLO inference + draw
#         results = model(rgb, size=640)
#         for *box, conf, cls in results.xyxy[0]:
#             x1, y1, x2, y2 = map(int, box)
#             lbl = results.names[int(cls)]
#             cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
#             cv2.putText(
#                 frame,
#                 f"{lbl} {conf:.2f}",
#                 (x1, y1-10),
#                 cv2.FONT_HERSHEY_SIMPLEX,
#                 0.5,
#                 (0,255,0),
#                 1
#             )

#         # MJPEG
#         ret, buf = cv2.imencode('.jpg', frame)
#         yield (
#             b'--frame\r\n'
#             b'Content-Type: image/jpeg\r\n\r\n' +
#             buf.tobytes() +
#             b'\r\n'
#         )

# # 9) /video_feed route
# @app.route('/video_feed')
# def video_feed():
#     student_id = request.args.get('student')
#     exam_id    = request.args.get('exam')
#     raw_token  = request.args.get('token')
#     if not student_id or not exam_id or not raw_token:
#         return "Missing params", 400

#     global STUDENT_TOKEN
#     STUDENT_TOKEN = (
#         raw_token
#         if raw_token.startswith('Bearer ')
#         else f"Bearer {raw_token}"
#     )

#     return Response(
#         gen_frames(student_id, exam_id),
#         mimetype='multipart/x-mixed-replace; boundary=frame'
#     )

# # 10) Release camera endpoint
# @app.route('/release_camera', methods=['POST'])
# def release_camera():
#     global cap
#     try:
#         if cap and cap.isOpened():
#             cap.release()
#     except Exception as e:
#         print('Error releasing camera:', e)
#     return 'Camera released', 200

# # 11) Optional camera preview
# @app.route('/camera')
# @cross_origin()
# def camera_page():
#     return """
#     <!doctype html><html><head><style>
#     html,body{margin:0;padding:0;height:100%;overflow:hidden;background:black;}
#     img{width:100%;height:100%;object-fit:cover;}
#     </style></head>
#     <body><img src="/video_feed" /></body></html>
#     """, 200, {'Content-Type': 'text/html'}

# # 12) Start server
# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5000, threaded=True)














# File: backend/yolo_server.py

from flask import Flask, Response, request
from flask_cors import CORS
from dotenv import load_dotenv
import os, cv2, torch, atexit, jwt, time, threading, collections, numpy as np, mediapipe as mp, requests

# ── Load .env ─────────────────────────────────────────────
load_dotenv()
SECRET = os.getenv('JWT_SECRET')
if not SECRET:
    raise RuntimeError("JWT_SECRET not set in .env")

app = Flask(__name__)
CORS(app)

# 1) Load YOLOv5s & warmup
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
model.conf, model.iou = 0.5, 0.45
_dummy = np.zeros((640, 640, 3), dtype=np.uint8)
_ = model(_dummy, size=640)

# 2) MediaPipe face‐mesh setup
mp_face   = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5
)

# 3) Frame buffer & cheat lock
FRAME_BUFFER     = collections.deque(maxlen=150)
CHEAT_LOCK       = threading.Lock()
cheated_recently = False

# 4) Lazy camera handle (release on exit)
cap = None
atexit.register(lambda: cap.release() if cap and cap.isOpened() else None)

# 5) EAR helper
def eye_aspect_ratio(landmarks, indices):
    import math
    pts = [(landmarks[i].x, landmarks[i].y) for i in indices]
    A = math.dist(pts[0], pts[3])
    B = (math.dist(pts[1], pts[5]) + math.dist(pts[2], pts[4])) / 2
    return B/A if A else 0

# 6) Cheat handler (5s clip + upload + auto‐submit)
def handle_cheat(student_id, exam_id, token_header):
    global cheated_recently
    ts = int(time.time())
    clip_name = f"cheat_{ts}.mp4"

    # write buffer → file
    if FRAME_BUFFER:
        h, w = FRAME_BUFFER[0].shape[:2]
        out = cv2.VideoWriter(
            clip_name,
            cv2.VideoWriter_fourcc(*'mp4v'),
            30,
            (w, h)
        )
        for frm in list(FRAME_BUFFER):
            out.write(frm)
        out.release()

    headers = {'Authorization': token_header}
    try:
        # 1) Upload cheat clip
        with open(clip_name, 'rb') as f:
            requests.post(
                'http://localhost:5000/api/cheats',
                files={'clip': f},
                data={'studentId': student_id, 'examId': exam_id},
                headers=headers,
                timeout=5
            )
        # 2) Auto‐submit
        requests.post(
            f'http://localhost:5000/api/exams/{exam_id}/submit-cheat',
            json={'studentId': student_id},
            headers=headers,
            timeout=5
        )
    except Exception as e:
        print("Cheat handling error:", e)

    # cooldown
    time.sleep(10)
    with CHEAT_LOCK:
        cheated_recently = False

# 7) Frame generator
def gen_frames(student_id, exam_id, token_header):
    global cap, cheated_recently

    while True:
        if not cap or not cap.isOpened():
            cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

        success, frame = cap.read()
        if not success:
            cap.release()
            continue

        # buffer frame
        FRAME_BUFFER.append(frame.copy())

        # face‐mesh → EAR check
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_res = face_mesh.process(rgb)
        if mp_res.multi_face_landmarks:
            lm = mp_res.multi_face_landmarks[0].landmark
            left  = eye_aspect_ratio(lm, [33,160,158,133,153,144])
            right = eye_aspect_ratio(lm, [263,387,385,362,380,373])
            with CHEAT_LOCK:
                if (left < 0.2 or right < 0.2) and not cheated_recently:
                    cheated_recently = True
                    threading.Thread(
                        target=handle_cheat,
                        args=(student_id, exam_id, token_header),
                        daemon=True
                    ).start()

        # YOLO inference + draw
        results = model(rgb, size=640)
        for *box, conf, cls in results.xyxy[0]:
            x1,y1,x2,y2 = map(int, box)
            lbl = results.names[int(cls)]
            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
            cv2.putText(
                frame,
                f"{lbl} {conf:.2f}",
                (x1, y1-10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5, (0,255,0), 1
            )

        # MJPEG
        ret, buf = cv2.imencode('.jpg', frame)
        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' +
            buf.tobytes() +
            b'\r\n'
        )

# 8) /video_feed route: decode JWT & kick off gen_frames
@app.route('/video_feed')
def video_feed():
    raw_token = request.args.get('token')
    exam_id   = request.args.get('exam')
    if not raw_token or not exam_id:
        return "Missing params", 400

    # strip "Bearer " if present
    token = raw_token.split()[-1]
    try:
        payload = jwt.decode(token, SECRET, algorithms=['HS256'])
        student_id = payload['userId']
    except jwt.ExpiredSignatureError:
        return "Token expired", 401
    except Exception:
        return "Invalid token", 401

    # preserve full header for downstream uploads
    bearer_header = (
        raw_token if raw_token.startswith('Bearer ')
        else f"Bearer {token}"
    )

    return Response(
        gen_frames(student_id, exam_id, bearer_header),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

# 9) Release camera endpoint
@app.route('/release_camera', methods=['POST'])
def release_camera():
    global cap
    if cap and cap.isOpened():
        cap.release()
    return 'Camera released', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
