#include <napi.h>
#include "functions.h"
#include "analysis.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  cppfunction::Init(env, exports);
  return Analysis::Init(env, exports);
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, InitAll)
