
from settings       import settings

from src.files      import Files
from src.preview    import Preview
from src.online     import Online
from src.algorithm  import Algorithm
from src.flickr     import Flickr

# import colorama
# colorama.init(autoreset=True)

import threading

files = Files(settings)
preview = Preview(settings)
algorithm = Algorithm(settings)
flickr = Flickr(settings)
online = Online(settings)

if __name__ == "__main__":

    preview.init()
    test = {'stat': 'free'}

    a = threading.Thread(target=files.run, args=(test,))
    b = threading.Thread(target=preview.run, args=(test,))
    c = threading.Thread(target=algorithm.run, args=(test,))
    d = threading.Thread(target=flickr.run, args=(test,))
    e = threading.Thread(target=online.run, args=(test,))

    try:
        a.start()
        b.start()
        c.start()
        d.start()
        e.start()
    except KeyboardInterrupt:
        a.join()
        b.join()
        c.join()
        d.join()
        e.join()