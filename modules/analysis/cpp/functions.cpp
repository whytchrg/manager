#include "functions.h"
#include "include/CImg-2.6.7/CImg.h"
#define cimg_using_png

std::string cppfunction::color(std::string input) {
  const char* imagePath = input.c_str();
  cimg_library::CImg<unsigned char> image(imagePath);

  std::string output = "bw";
  if(image.spectrum() > 1) {
    output = "color";
  }

  return output;
}

Napi::String cppfunction::ColorWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  Napi::String input = info[0].As<Napi::String>();

  Napi::String returnValue = Napi::String::New(env, cppfunction::color(input.Utf8Value()));

  return returnValue;
}

Napi::Object cppfunction::Init(Napi::Env env, Napi::Object exports) {
  exports.Set("color", Napi::Function::New(env, cppfunction::ColorWrapped));
  return exports;
}
