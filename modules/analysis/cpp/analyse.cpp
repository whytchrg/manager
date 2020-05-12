#include "analyse.h"

Analyse::Analyse(std::string input) {

    p = input;
    const char* imagePath = input.c_str(); // converting input std::string to C string
    cimg_library::CImg<unsigned char> img(imagePath);
    h = round(img.height() / ( img.width() / static_cast<double>(w) ));

    image = img;
    image.resize(w, h);

    if(image.spectrum() > 1) {
        c = true;
    }

}

std::string Analyse::path() {

    return p;
};

bool Analyse::color() {

    return c;
};

unsigned char Analyse::brightness() {

    unsigned char output = image.sum() / image.size();

    return output;
};

unsigned char Analyse::saturation() {

    unsigned char output = 0;

    if(c) {
        cimg_library::CImg<double> hsl = image.get_RGBtoHSL();

        double sum = 0;

        // Dump all pixels
        for(int y = 0; y < hsl.height(); y++) {
            for(int x = 0; x < hsl.width(); x++) {
                double *s = hsl.data(x, y, 0, 1);

                sum = sum + *s;
            }
        }

        output = round((sum / (hsl.width() * hsl.height())) * 255);
    }

    return output;
};
