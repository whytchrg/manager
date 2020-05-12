#include <napi.h>
#include "analyse.h"

class Analysis : public Napi::ObjectWrap<Analysis> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  Analysis(const Napi::CallbackInfo& info);
  Analyse* GetInternalInstance();

 private:
  static Napi::FunctionReference constructor;
  Napi::Value Path(const Napi::CallbackInfo& info);
  Napi::Value Color(const Napi::CallbackInfo& info);
  Napi::Value Brightness(const Napi::CallbackInfo& info);
  Napi::Value Saturation(const Napi::CallbackInfo& info);
  Analyse *Analyse_;
};
