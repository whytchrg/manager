#include <napi.h>

namespace cppfunction {
  std::string hello();
  std::string color(std::string input);
  Napi::String HelloWrapped(const Napi::CallbackInfo& info);
  Napi::String ColorWrapped(const Napi::CallbackInfo& info);
  int add(int a, int b);
  Napi::Number AddWrapped(const Napi::CallbackInfo& info);
  Napi::Object Init(Napi::Env env, Napi::Object exports);
}
