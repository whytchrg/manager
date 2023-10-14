
from src.data import Data

import exiftool
import os, time, datetime

class Files(Data):

    def __init__(self, presets):
        super().__init__(presets)

        self.version = '0.0.0'

    def eval(self):

        data  = self.get_database()

        try:
            files = self.read_files()
        except Exception as err:
            print(f"Unexpected {err=}, {type(err)=}")

        removed_files  = self.get_difference(data, files)
        new_files      = self.get_difference(files, data)
        modified_files = self.get_modified(data, files)

        self.remove_entries(removed_files)
        self.print_results(removed_files, 'entries removed from the database')

        self.insert_entries(new_files)
        self.print_results(new_files, 'entries inserted into the database')

        self.update_entries(modified_files)
        self.print_results(modified_files, 'entries updated in the database')

        if len(removed_files) > 0 or len(new_files) > 0 or len(modified_files) > 0:
            self.result = True

    def read_files(self):
        raw_files = [f for f in os.listdir(self.path) if os.path.isfile(os.path.join(self.path, f)) and f.lower().endswith(('.mp3', '.mp4', '.jpg', '.jpeg'))]

        files = []
        for raw_entry in raw_files:
            file = os.path.join(self.path, raw_entry)

            mtime = os.path.getmtime(file)
            ctime = os.path.getctime(file)

            if ctime > mtime:
                modified = ctime
            else:
                modified = mtime

            files.append({
                'name': raw_entry,
                'metadata': {
                    'file': file,
                    'modified': modified
                }
            })
        return files

    def get_difference(self, test, base):
        difference = []
        for test_entry in test:
            result = True
            for base_entry in base:
                if test_entry['name'] == base_entry['name']:
                    result = False
                    break
            if result == True:
                difference.append(test_entry)

        return difference

    def get_modified(self, test, base):
        modified = []
        for test_entry in test:
            result = False
            for base_entry in base:

                if test_entry['name'] == base_entry['name']:

                    if test_entry['metadata']['modified'] != base_entry['metadata']['modified']:
                        test_entry['metadata']['modified'] = base_entry['metadata']['modified']
                        result = True
                        break

                    if test_entry['metadata']['version'] != self.version:
                        result = True
                        break

            if result == True:
                modified.append(test_entry)

        return modified

    def remove_entries(self, data):
        for entry in data:
            self.db.remove(self.data.name == entry['name'])

    def insert_entries(self, data):
        metadata = self.get_metadata(data)
        index = 0
        for entry in metadata:
            self.db.insert({
                'name': data[index]['name'],
                'metadata': entry,
            })
            index += 1

    def update_entries(self, data):
        metadata = self.get_metadata(data)
        index = 0
        for entry in metadata:
            self.db.update({
                'metadata': entry
            }, self.data.name == data[index]['name'])
            index += 1

    def get_metadata(self, input):

        raw_files = []
        for entry in input:
            raw_files.append(entry['metadata']['file'])

        raw_metadata = []
        if len(raw_files) > 0:

            with exiftool.ExifToolHelper() as tool:
                raw_metadata = tool.get_metadata(raw_files)

        def get_time_value(raw):
            value = raw.split('+')
            return int(round(float(value[0].replace('Z', ''))))

        metadata = []
        index = 0
        
        for entry in raw_metadata:

            # created
            if 'File:MIMEType' in entry:
                file_type = entry['File:MIMEType']

            # created
            if 'IPTC:DateCreated' in entry and 'IPTC:TimeCreated' in entry:
                meta_date = entry['IPTC:DateCreated'].split(':')
                meta_time = entry['IPTC:TimeCreated'].split(':')

            elif 'XMP:DateCreated' in entry:
                meta_date_time = entry['XMP:DateCreated'].split(' ')
                meta_date = meta_date_time[0].split(':')
                meta_time = meta_date_time[1].split(':')

            else:
                meta_date_time = entry['XMP:CreateDate'].split(' ')
                meta_date = meta_date_time[0].split(':')
                meta_time = meta_date_time[1].split(':')

            year = int(meta_date[0])
            month = int(meta_date[1])
            day = int(meta_date[2])

            if len(meta_time) > 2:
                hour   = get_time_value(meta_time[0])
                minute = get_time_value(meta_time[1])
                second = get_time_value(meta_time[2])

                new_date_time = datetime.datetime(year, month, day, hour, minute, second)
            elif len(meta_time) > 1:
                hour   = get_time_value(meta_time[0])
                minute = get_time_value(meta_time[1])

                new_date_time = datetime.datetime(year, month, day, hour, minute, 0)
            elif len(meta_time) > 0:
                hour   = get_time_value(meta_time[0])

                new_date_time = datetime.datetime(year, month, day, hour, 0, 0)
            else:
                new_date_time = datetime.datetime(year, month, day, 12, 0, 0)

            created = time.mktime(new_date_time.timetuple())

            # added
            if 'added' in input[index]:
                added = input[index]['metadata']['added']
            else:
                added = time.time()

            # updated
            if entry['XMP:HistoryChanged'][-1] == '/':
                updated = input[index]['metadata']['modified']
            else:
                if 'updated' in input[index]:
                    updated = input[index]['metadata']['updated']
                else:
                    updated = created

            #modified
            modified = input[index]['metadata']['modified']

            # title
            if 'XMP:Headline' in entry:
                title = entry['XMP:Headline']
            else:
                title = input[index]['name'].rsplit('.', 1)[0]

            # description
            if 'XMP:Description' in entry:
                description = entry['XMP:Description']
            else:
                description = ''

            # keywords
            if 'XMP:Subject' in entry:
                keywords = entry['XMP:Subject']
            else:
                keywords = []

            metadata.append({
                'version': self.version,
                'type': file_type,
                'file': input[index]['metadata']['file'],
                'created': created,
                'added': added,
                'modified': modified,
                'updated': updated,
                'title': title,
                'description': description,
                'keywords': keywords
            })
            index += 1
        return metadata
