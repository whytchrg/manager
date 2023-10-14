
from src.data import Data

import flickrapi
import time, math

class Flickr(Data):

    def __init__(self, presets):
        super().__init__(presets)

        self.api_key = presets['flickr-api-key']
        self.api_src = presets['flickr-api-src']
        self.usr_id = presets['flickr-usr-id']

        self.version = '0.0.0'

    def eval(self):
        data  = self.get_database()

        test = True
        try:
            flickr = self.read_photos()
        except Exception as err:
            print(self.get_namestamp() + 'flickrapi had an error' )
            test = False

        if test:
            try:
                entries_with_activity = self.get_activity(data, flickr)
            except Exception as err:
                print(f"Unexpected {err=}, {type(err)=}")
        else:
            entries_with_activity = []

        self.print_results(entries_with_activity, 'flickr activity')

        if len(entries_with_activity) > 0:
            self.result = True

    def read_photos(self):
        flickr = flickrapi.FlickrAPI(self.api_key, self.api_src, format='parsed-json')

        info = flickr.people.getInfo(user_id=self.usr_id)
        photo_count = info['person']['photos']['count']['_content']
        pages = math.ceil(photo_count/500)

        photos = []
        extra = 'views, date_upload'
        for i in range(pages):
            flickr_photos = flickr.people.getPublicPhotos(user_id=self.usr_id, extras=extra, page=i + 1, per_page=500)

            for photo in flickr_photos['photos']['photo']:
                photo['dateupload'] = float(photo['dateupload'])
                photo['views'] = int(photo['views'])
                photos.append(photo)

        return photos

    def get_activity(self, data, flickr):
        select = []
        for photo in flickr:
            test = False
            for entry in data:
                if(photo['title'] == entry['name'].rsplit('.', 1)[0]):

                    if entry['metadata']['added'] > photo['dateupload']:

                        metadata = entry['metadata']
                        metadata['added'] = photo['dateupload']

                        self.db.update({
                            'metadata': metadata
                        }, self.data.name == entry['name'])

                    if 'flickr' in entry:

                        views = entry['flickr']['views']
                        if len(views) != photo['views']:

                            new_views = photo['views'] - len(views)
                            now = time.time() * 1000

                            if len(views) == 0:
                                latest = photo['dateupload']
                            else:
                                latest = max(views)

                            steps = (now - latest) / new_views
                            for i in range(new_views):
                                views.append(latest + steps + (steps * i))

                            test = True

                        if 'version' not in entry['flickr'] or entry['flickr']['version'] != self.version:
                            test = True

                    else:
                        views = []
                        test = True

                    if test == True:
                        flickr_entry = photo
                        flickr_entry['views'] = views
                        flickr_entry['version'] = self.version
                        self.db.update({
                            'flickr': flickr_entry
                        }, self.data.name == entry['name'])
                        select.append(entry)

        return select


