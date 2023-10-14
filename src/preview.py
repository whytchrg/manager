
from src.data import Data

from PIL import Image
import audio2numpy
import numpy as np
import cv2

import math, os, ftplib, json

class Preview(Data):

    def __init__(self, presets):
        super().__init__(presets)

        self.directory = presets['directory']
        self.previews = presets['previews']
        self.preview_path = os.path.join(self.path, presets['preview'])

        self.hst = presets['ftp-hst']
        self.usr = presets['ftp-usr']
        self.key = presets['ftp-key']

        self.measure = 1024
        self.version = '0.0.0'

    def init(self):
        local_remove = self.preview_clean_up()
        if len(local_remove) == 1:
            self.print_results(local_remove, 'file removed from previews')
        else:
            self.print_results(local_remove, 'files removed from previews')

        remote_remove = self.ftp_clean_up()
        if len(remote_remove) == 1:
            self.print_results(remote_remove, 'file deleted from server')
        else:
            self.print_results(remote_remove, 'files deleted from server')

    def eval(self):
        data  = self.get_database()

        try:
            previews = self.read_previews()
        except Exception as err:
            print(f"Unexpected {err=}, {type(err)=}")

        data_todo = self.get_todo(data, previews)
        images_to_upload, data_to_update = self.create_preview(data_todo)

        self.upload_files(images_to_upload)
        if len(images_to_upload) == 1:
            self.print_results(images_to_upload, 'file uploaded to the server')
        else:
            self.print_results(images_to_upload, 'files uploaded to the server')

        self.update_data(data_to_update)
        if len(data_to_update) == 1:
            self.print_results(data_to_update, 'entry updated in the database')
        else:
            self.print_results(data_to_update, 'entries updated in the database')

        if len(images_to_upload) > 0 or len(data_to_update) > 0:
            self.result = True

    def preview_clean_up(self):
        files = self.read_files()    
        previews = self.read_previews()

        to_remove = []
        for entry in previews:
            if not self.preview_in_files(entry, files):
                to_remove.append(entry)

        for entry in to_remove:
            file = os.path.join(self.preview_path, entry)
            if os.path.exists(file):
                os.remove(file)

        return to_remove

    def preview_in_files(self, filename, files):
        titles = []
        for entry in files:
            titles.append(entry.rsplit('.', 1)[0])

        title = filename.rsplit('.', 1)[0]
        for ex in self.previews:
            title = title.replace('_' + ex, '')

        result = True
        if title not in titles:
            result = False

        return result

    def ftp_clean_up(self):
        session = ftplib.FTP(self.hst, self.usr, self.key)
        session.cwd(self.directory)

        ftp_list = []
        session.retrlines('MLSD', ftp_list.append)

        ftp_files = []
        for ftp_entry in ftp_list:
            a = ftp_entry.split(';')
            filename = a[-1].replace(' ', '')
            b = a[0].split('=')
            if b[1] == 'file':
                ftp_files.append(filename)

        previews = self.read_previews()
        files = self.read_files()

        local_files = previews + files

        obsolet_ftp_files = []
        for ftp_file in ftp_files:
            if ftp_file not in local_files:
                obsolet_ftp_files.append(ftp_file)

        for entry in obsolet_ftp_files:
            session.delete(entry)

        session.quit()
        return obsolet_ftp_files

    def read_previews(self):
        previews = [f for f in os.listdir(self.preview_path) if os.path.isfile(os.path.join(self.preview_path, f)) and f.lower().endswith(('.jpg'))]
        return previews

    def read_files(self):
        files = [f for f in os.listdir(self.path) if os.path.isfile(os.path.join(self.path, f)) and f.lower().endswith(('.mp3', '.mp4', '.jpg', '.jpeg'))]
        return files

    def get_todo(self, data, previews):
        todo = []

        for entry in data:
            if 'preview' not in entry:
                todo.append(entry)
            elif entry['metadata']['updated'] > entry['preview']['updated']:
                todo.append(entry)
            elif not self.preview_exists(entry, previews):
                todo.append(entry)
            elif entry['preview']['version'] != self.version:
                todo.append(entry)

        return todo

    def preview_exists(self, entry, previews):
        title = entry['name'].rsplit('.', 1)[0]
        result = True

        for ex in self.previews:
            search = title + '_' + ex + '.jpg'
            if search not in previews:
                result = False

        return result

    def create_preview(self, data):
        images_to_upload = []
        data_to_update = []

        for entry in data:

            images_to_upload.append(entry['metadata']['file'])

            if entry['metadata']['type'] == 'video/mp4':
                image = self.video_preview(entry['metadata']['file'])
            elif entry['metadata']['type'] == 'audio/mpeg':
                image = self.audio_preview(entry['metadata']['file'])
            else:
                image = self.image_preview(entry['metadata']['file'])

            h, w = image.shape[:2]
            aspect = w/h

            if aspect > 2:
                orientation = 'long'
            if aspect > 1:
                orientation = 'landscape'
            else:
                orientation = 'portrait'

            metadata = {
                    'version': self.version,
                    'updated': entry['metadata']['updated'],
                    'orientation': orientation,
                    'images': [] 
                }

            c = 0
            for ex in self.previews:
                # multiply by more than 1
                divsion = c * 4
                if divsion == 0:
                    divsion = 1
                c += 1

                height = np.round(self.measure/divsion).astype(int)
                width = np.round(height*aspect).astype(int)

                size = (width, height)

                temp = cv2.resize(image, size, cv2.INTER_CUBIC)

                name = entry['name'].rsplit('.', 1)[0]
                preview_name = name + '_' + ex + '.jpg' 
                preview_file = os.path.join(self.preview_path, preview_name)

                temp = temp[:, :, ::-1].copy()
                result = Image.fromarray(temp.astype(np.uint8))
                result.save(preview_file, quality=80)

                # cv2.imwrite(preview_file, temp)
                metadata['images'].append(preview_name)
                images_to_upload.append(preview_file)

            data_to_update.append({
                    'name': entry['name'],
                    'metadata': metadata
                })

        return images_to_upload, data_to_update

    def image_preview(self, file):

        pil_image = Image.open(file).convert('RGB') 

        open_cv_image = np.array(pil_image) 
        open_cv_image = open_cv_image[:, :, ::-1].copy()

        return open_cv_image

    def audio_preview_a(self, file):
        signal = audio2numpy.open_audio(file)[0]
        signal = (signal - np.amin(signal)) * (1 / (np.amax(signal) - np.amin(signal)) ) * 255
        signal = signal.astype('uint8')

        h = self.measure
        w = round(h * math.sqrt(2))

        image = cv2.resize(signal, (w, h), interpolation = cv2.INTER_AREA)
        image = cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)

        return cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)

    def audio_preview(self, file):
        signal = audio2numpy.open_audio(file)[0]
        time, channels = signal.shape

        signal = (signal - np.amin(signal)) / (np.amax(signal) - np.amin(signal))

        # disply channel
        dc_h = self.measure
        dc_w = round(dc_h / math.sqrt(2) / 2)

        left = np.full((dc_h, dc_w, 1), 255, dtype = "uint8")
        right = np.full((dc_h, dc_w, 1), 255, dtype = "uint8")

        width = round(time / dc_h)
        height = dc_h

        h = height - 1
        w = dc_w  - 1

        c = 0
        for i in range(height):
            for j in range(width):
                y = (h - i)
                xL = math.floor(signal[c][0] * w)
                left[y][xL] = left[y][xL] * 0.999
                xR = math.floor( signal[c][1] * w)
                right[y][xR] = right[y][xR] * 0.999
                c += 1
                if c >= time:
                    break

        audio = np.concatenate((left, right), axis=1)
        audio = cv2.rotate(audio, cv2.ROTATE_90_CLOCKWISE) 

        return cv2.cvtColor(audio, cv2.COLOR_GRAY2RGB)

    def video_preview(self, file):
        video = cv2.VideoCapture(file)
        image = video.read()[1]

        return image

    def upload_files(self, files):
        if len(files) > 0:
            if len(files) == 1:
                self.print_results(files, 'ftp upload')
            else:
                self.print_results(files, 'ftp uploads')

            session = ftplib.FTP(self.hst, self.usr, self.key)
            session.cwd(self.directory)

            for file in files:
                filename = os.path.basename(file)
                # print(self.get_namestamp + str(filename) + ' uploading ...')
                binaryi = open(file, 'rb')
                session.storbinary('STOR ' + filename, binaryi)
                binaryi.close()

            session.quit()

    def update_data(self, data):
        for entry in data:
            self.db.update({
                'preview': entry['metadata']
            }, self.data.name == entry['name'])
