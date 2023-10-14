
import os, math, datetime, time, random

# import atexit

import colorama

import tinydb

# colorama.init(autoreset=True)

class Data:

    def __init__(self, presets):
        self.name = self.__class__.__name__

        # index and interval
        self.index = presets['index']
        presets['index'] += 1

        self.limit = presets['limit'] * presets['index'] 
        self.starting_interval = presets['interval']
        self.interval = self.starting_interval
        presets['interval'] = presets['interval'] * presets['increase']

        # filesystem path
        self.path = os.path.join(presets['path'], presets['directory'])

        # database access
        self.db = tinydb.TinyDB(os.path.join(self.path , presets['db']))
        self.data = tinydb.Query()

        # flow control
        self.running = True
        self.terminated = False
        self.result = False

       #  atexit.register(self.cleanup)

    # Deleting (Calling destructor)
    # def __del__(self):
    #     print(self.get_namestamp() + 'Running cleanup ...')
    #     self.running = False
    #     while self.terminated == False:
    #         pass

    # def cleanup(self):
    #     print(self.get_namestamp() + 'Running cleanup ...')
    #     self.running = False
    #     while self.terminated == False:
    #         pass

    def run(self, test):
        try:
            print(self.get_namestamp() + 'running ...')
            print_interval = time.strftime('%H:%M:%S', time.gmtime(self.starting_interval))
            print(self.get_namestamp() + 'starting interval: ' + str(print_interval))
            print_interval = time.strftime('%H:%M:%S', time.gmtime(self.limit))
            print(self.get_namestamp() + 'limit: ' + str(print_interval ))

            counter = 1
            while self.running:
                if self.result:
                    self.result = False
                    self.interval = self.starting_interval
                    counter = 1

                if test['stat'] == 'free':
                    test['stat'] = self.name

                    try:
                        self.eval()
                    except Exception as err:
                        print('data eval')
                        print(f"Unexpected {err=}, {type(err)=}")

                    interval = math.floor(self.interval * counter)
                    if interval > self.limit:
                        interval = self.limit
                    half = math.floor(interval / 2)
                    min = interval - half
                    max = math.floor(interval + half / 2)
                    if min < 0:
                        min = 0
                    if max < 1:
                        max = 1
                    if (max - min) > 1:
                        self.interval = random.randrange(min, max)
                    else:
                        self.interval = 2
                    print_interval = time.strftime('%H:%M:%S', time.gmtime(self.interval))
                    print(self.get_namestamp() + 'next check in: ' + str(print_interval))

                    if self.interval < self.limit / 2:
                        counter += 1

                else:
                    print(self.get_namestamp() + 'database was blocked')

                if test['stat'] == self.name:
                    test['stat'] = 'free'

                for i in range(self.interval):
                    if self.running:
                        time.sleep(1)
                    else:
                        break

                self.terminated = True
        except KeyboardInterrupt:
            print(self.get_namestamp() + colorama.Fore.RED + 'closed' + colorama.Style.RESET_ALL)
            return

    def get_database(self):
        try:
            data  = self.db.all()
        except Exception as err:
            print(f"Unexpected {err=}, {type(err)=}")
        return data

    def get_timestamp(self):
        return datetime.datetime.today().strftime('%Y-%m-%d %H:%M:%S') + ' - '

    def get_name(self):
        return self.get_print_color() + self.name + colorama.Style.RESET_ALL + ' => '

    def get_namestamp(self):
        return self.get_timestamp() + self.get_name()

    def print_results(self, data, text):
        if len(data) > 0:
            print(self.get_namestamp() + str(len(data)) + ' ' + text)

    def get_print_color(self):
        if self.index == 0:
            return colorama.Fore.YELLOW + colorama.Style.NORMAL
        elif self.index == 1:
            return colorama.Fore.GREEN + colorama.Style.NORMAL
        elif self.index == 2:
            return colorama.Fore.CYAN + colorama.Style.NORMAL
        elif self.index == 3:
            return colorama.Fore.BLUE + colorama.Style.NORMAL
        elif self.index == 4:
            return colorama.Fore.MAGENTA + colorama.Style.NORMAL
        elif self.index == 5:
            return colorama.Fore.RED + colorama.Style.NORMAL
        else:
            return colorama.Fore.WHITE + colorama.Style.NORMAL
