#include <cmath>
#include <string>

#define cimg_use_png  1
#define cimg_use_tiff 1
#define cimg_use_jpeg 1

#include "CImg.h"

class Analyse {
    private:
        cimg_library::CImg<unsigned char> image;
        std::string p;
        int w { 200 };
        int h;
        bool c{ false };
    public:
        Analyse(std::string input);
        std::string path();
        bool color();
        unsigned char brightness();
        unsigned char saturation();
};
