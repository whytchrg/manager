
from src.data import Data

import requests
import json, ast

class Online(Data):

    def __init__(self, presets):
        super().__init__(presets)

        self.table = presets['directory']
        self.api = presets['api']

        self.version = '0.0.1'

    def eval(self):
        if self.get_availability():
            data  = self.get_data()
            remote = self.get_remote()

            inserted = self.get_inserted(data, remote)        
            modified = self.get_modified(data)
            removed = self.get_removed(data, remote)

            self.insert(inserted)
            self.print_results(inserted, 'entries inserted')

            self.update(modified)
            self.print_results(modified, 'entries updated')

            self.delete(removed)
            self.print_results(removed, 'entries removed')

            new_views = self.get_views(remote)
            self.print_results(new_views, 'files viewed')

            new_seen = self.get_seen(remote)
            self.print_results(new_seen, 'files seen')

            if len(inserted) > 0 or len(modified) > 0 or len(removed) > 0 or len(new_views) > 0 or len(new_seen) > 0:
                self.result = True

    def get_availability(self):
        data = self.get_database()
        test = True
        for entry in data:
            if 'preview' not in entry:
                test = False
                break
            if 'algorithm' not in entry:
                test = False
                break
        return test

    def get_data(self):
        data = self.get_database()
        for entry in data:
            if 'online' not in entry:
                self.make_online(entry)

        data = self.get_database()
        return data

    def get_remote(self):
        request = {
            'client': 'manager',
            'request': 'init',
            'table': self.table
        }

        result = requests.post(self.api, json = request)
        mysql = ast.literal_eval(result.text)

        remote = json.loads(mysql['data'])
        index = 0
        for entry in remote:
            remote[index]['created'] = float(entry['created'])
            remote[index]['modified'] = float(entry['modified'])
            if entry['keywords'] == '':
                remote[index]['keywords'] = ''
            else:
                remote[index]['keywords'] = json.loads(entry['keywords'])
            remote[index]['algorithm'] = float(entry['algorithm'])
            views = []
            if entry['views'] != None:
                a = entry['views'].split(';')
                for b in a:
                    c = json.loads(b)
                    c['client'] = float(c['client'])
                    c['server'] = int(c['server'])
                    if len(str(c['server'])) < 12:
                        c['server'] = float(c['server'] * 1000)
                    views.append(c)
            remote[index]['views'] = views

            seen = []
            if entry['seen'] != None and entry['seen'] != '':
                a = entry['seen'].split(';')
                for b in a:
                    c = json.loads(b)
                    c['client'] = float(c['client'])
                    c['server'] = int(c['server'])
                    if len(str(c['server'])) < 12:
                        c['server'] = float(c['server'] * 1000)
                    seen.append(c)

            remote[index]['seen'] = seen

            index += 1

        return remote

    def get_inserted(self, local_data, remote_data):
        insert = []
        for local in local_data:
            test = False
            for remote in remote_data:
                if local['name'] == remote['name']:
                    test = True
                    break
            if test == False:
                insert.append(local)

        return insert

    def insert(self, data):
        if len(data) > 0:
            inserts = self.make_remote_online(data)

            request = {
                'client': 'manager',
                'request': 'insert',
                'table': self.table,
                'data': json.dumps(inserts)
            }

            result = requests.post(self.api, json = request)
            result = ast.literal_eval(result.text)

    def get_modified(self, data):
        modified = []

        for entry in data:
            if float(round(entry['metadata']['modified'])) > entry['online']['modified']:
                modified.append(entry)
            elif entry['algorithm']['value'] != entry['online']['algorithm']:
                modified.append(entry)
            elif entry['online']['version'] != self.version:
                modified.append(entry)

        return modified

    def update(self, data):
        if len(data) > 0:

            i = 0
            for entry in data:
                data[i]['online'] = self.make_online(entry)
                i += 1

            update_data = self.make_remote_online(data)
            request = {
                'client': 'manager',
                'request': 'update',
                'table': self.table,
                'data': json.dumps(update_data)
            }

            result = requests.post(self.api, json = request)
            result = ast.literal_eval(result.text)

    def get_removed(self, local_data, remote_data):
        removed = []
        for remote in remote_data:
            test = False
            for local in local_data:
                if remote['name'] == local['name']:
                    test = True
                    break
            if test == False:
                removed.append(remote)

        return removed

    def delete(self, data):
        if len(data) > 0:
            request = {
                'client': 'manager',
                'request': 'delete',
                'table': self.table,
                'data': json.dumps(data)
            }

            result = requests.post(self.api, json = request)
            result = ast.literal_eval(result.text)

    def get_views(self, data):
        db = self.get_database()
        select = []
        for entry in db:
            for remote in data:
                if entry['name'] == remote['name'] and len(entry['online']['views']) < len(remote['views']):

                    entry['online']['views'] = remote['views']
                    self.db.update({
                        'online': entry['online']
                    }, self.data.name == entry['name'])
                    select.append(entry)
        
        return select

    def get_seen(self, data):
        db = self.get_database()
        select = []
        for entry in db:
            for remote in data:
                if entry['name'] == remote['name'] and len(entry['online']['seen']) < len(remote['seen']):

                    entry['online']['seen'] = remote['seen']
                    self.db.update({
                        'online': entry['online']
                    }, self.data.name == entry['name'])
                    select.append(entry)
        
        return select

    def make_online(self, data):
        if 'online' in data:
            views = data['online']['views']
        else:
            views = []

        if 'online' in data and 'seen' in data['online']:
            seen = data['online']['seen']
        else:
            seen = []

        online = {
            'version': self.version,
            'name': data['name'],
            'type': data['metadata']['type'],
            'created': data['metadata']['created'],
            'modified': float(round(data['metadata']['modified'])),
            'title': data['metadata']['title'],
            'keywords': data['metadata']['keywords'],
            'description': data['metadata']['description'],
            'algorithm': data['algorithm']['value'],
            'orientation': data['preview']['orientation'],
            'display': data['preview']['images'][0],
            'medium': data['preview']['images'][1],
            'thumbnail': data['preview']['images'][2],
            'views': views,
            'seen': seen
        }

        self.db.update({
            'online': online
        }, self.data.name == data['name'])

        return online

    def make_remote_online(self, data):
        online_data = []
        for entry in data:

            online = {
                'version': entry['online']['version'],
                'name': entry['online']['name'],
                'type': entry['online']['type'],
                'created': str(int(entry['online']['created'])),
                'modified': str(int(entry['online']['modified'])),
                'title': entry['online']['title'],
                'keywords': json.dumps(entry['online']['keywords']),
                'description': entry['online']['description'],
                'algorithm': str(entry['online']['algorithm']),
                'orientation': entry['online']['orientation'],
                'display': entry['online']['display'],
                'medium': entry['online']['medium'],
                'thumbnail': entry['online']['thumbnail']
            }
            online_data.append(online)

        return online_data
