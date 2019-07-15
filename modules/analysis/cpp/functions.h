#include <napi.h>

namespace cppfunction {
  std::string color(std::string input);
  Napi::String ColorWrapped(const Napi::CallbackInfo& info);
  Napi::Object Init(Napi::Env env, Napi::Object exports);
}
