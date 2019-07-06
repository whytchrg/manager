#include <napi.h>
#include "functions.h"
#include "classes.h"
// #include "include/kfr/all.hpp"
// #include "include/CImg-2.6.7/CImg.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  cppfunction::Init(env, exports);
  return Classes::Init(env, exports);
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, InitAll)
