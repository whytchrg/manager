#include <napi.h>
#include "class.h"

class Classes : public Napi::ObjectWrap<Classes> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  Classes(const Napi::CallbackInfo& info);
  Class* GetInternalInstance();

 private:
  static Napi::FunctionReference constructor;
  Napi::Value GetValue(const Napi::CallbackInfo& info);
  Napi::Value Add(const Napi::CallbackInfo& info);
  Class *Class_;
};
