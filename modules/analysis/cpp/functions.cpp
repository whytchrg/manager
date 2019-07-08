#include "functions.h"
#include "include/CImg-2.6.7/CImg.h"
#define cimg_using_png

std::string cppfunction::hello() {
  return "Hello World";
}

std::string cppfunction::color(std::string input) {
  const char* imagePath = input.c_str();
  cimg_library::CImg<unsigned char> image(imagePath);

  std::string output = "bw";
  if(image.spectrum() > 1) {
    output = "color";
  }

  return output;
}

int cppfunction::add(int a, int b) {
  return a + b;
}

Napi::String cppfunction::HelloWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::String returnValue = Napi::String::New(env, cppfunction::hello());

  return returnValue;
}

Napi::String cppfunction::ColorWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  Napi::String input = info[0].As<Napi::String>();

  Napi::String returnValue = Napi::String::New(env, cppfunction::color(input.Utf8Value()));

  return returnValue;
}

Napi::Number cppfunction::AddWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
  }

  Napi::Number first = info[0].As<Napi::Number>();
  Napi::Number second = info[1].As<Napi::Number>();

  int returnValue = cppfunction::add(first.Int32Value(), second.Int32Value());

  return Napi::Number::New(env, returnValue);
}

Napi::Object cppfunction::Init(Napi::Env env, Napi::Object exports) {
  exports.Set("hello", Napi::Function::New(env, cppfunction::HelloWrapped));
  exports.Set("color", Napi::Function::New(env, cppfunction::ColorWrapped));
  exports.Set("add", Napi::Function::New(env, cppfunction::AddWrapped));
  return exports;
}
