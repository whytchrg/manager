#include "analysis.h"

// Define Class
Napi::FunctionReference Analysis::constructor;

Napi::Object Analysis::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "Analysis", {
    InstanceMethod("path", &Analysis::Path),
    InstanceMethod("color", &Analysis::Color),
    InstanceMethod("brightness", &Analysis::Brightness),
    InstanceMethod("saturation", &Analysis::Saturation),
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("Analysis", func);
  return exports;
}

// Define Input
Analysis::Analysis(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Analysis>(info)  {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  int length = info.Length();

  if (length != 1) {
    Napi::TypeError::New(env, "Only one argument expected").ThrowAsJavaScriptException();
  }

  if(!info[0].IsString()){
    Napi::Object object_parent = info[0].As<Napi::Object>();
    Analysis* example_parent = Napi::ObjectWrap<Analysis>::Unwrap(object_parent);
    Analyse* parent_actual_class_instance = example_parent->GetInternalInstance();
    this->Analyse_ = new Analyse(parent_actual_class_instance->path());          //// !!!!!!
    return;
  }
  Napi::String value = info[0].As<Napi::String>();
  this->Analyse_ = new Analyse(value.Utf8Value());
}

// Define Member (functions)
Napi::Value Analysis::Path(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  std::string str = this->Analyse_->path();
  return Napi::String::New(env, str);
}

Napi::Value Analysis::Color(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  bool bol = this->Analyse_->color();
  return Napi::Boolean::New(env, bol);
}

Napi::Value Analysis::Brightness(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  unsigned char num = this->Analyse_->brightness();
  return Napi::Number::New(env, num);
}

Napi::Value Analysis::Saturation(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  unsigned char num = this->Analyse_->saturation();
  return Napi::Number::New(env, num);
}

Analyse* Analysis::GetInternalInstance() {
  return this->Analyse_;
}
