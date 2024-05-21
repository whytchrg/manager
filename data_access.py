from settings import settings

import os

import tinydb

import numpy as np
import pandas as pd

class DataAccess:

    def __init__(self):

        self.path = os.path.join(settings['path'], settings['directory'])

        # database access
        self.db = tinydb.TinyDB(os.path.join(self.path , settings['db']))
        self.query = tinydb.Query()

        self.data = self.get_database()

    def get_database(self):
        try:
            data = self.db.all()
        except Exception as err:
            print(f"Unexpected {err=}, {type(err)=}")
        return data
