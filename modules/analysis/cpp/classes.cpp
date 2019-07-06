#include "classes.h"

Napi::FunctionReference Classes::constructor;

Napi::Object Classes::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "Classes", {
    InstanceMethod("add", &Classes::Add),
    InstanceMethod("getValue", &Classes::GetValue),
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("Classes", func);
  return exports;
}

Classes::Classes(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Classes>(info)  {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  int length = info.Length();
  
  if (length != 1) {
    Napi::TypeError::New(env, "Only one argument expected").ThrowAsJavaScriptException();
  }

  if(!info[0].IsNumber()){
    Napi::Object object_parent = info[0].As<Napi::Object>();
    Classes* example_parent = Napi::ObjectWrap<Classes>::Unwrap(object_parent);
    Class* parent_actual_class_instance = example_parent->GetInternalInstance();
    this->Class_ = new Class(parent_actual_class_instance->getValue());
    return;
  }

  Napi::Number value = info[0].As<Napi::Number>();
  this->Class_ = new Class(value.DoubleValue());
}

Napi::Value Classes::GetValue(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  double num = this->Class_->getValue();
  return Napi::Number::New(env, num);
}


Napi::Value Classes::Add(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  if (info.Length() != 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
  }

  Napi::Number toAdd = info[0].As<Napi::Number>();
  double answer = this->Class_->add(toAdd.DoubleValue());

  return Napi::Number::New(info.Env(), answer);
}

Class* Classes::GetInternalInstance() {
  return this->Class_;
}