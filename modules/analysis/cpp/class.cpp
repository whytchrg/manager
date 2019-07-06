#include "class.h"

Class::Class(double value){
    this->value_ = value;
}

double Class::getValue()
{
  return this->value_;
}

double Class::add(double toAdd)
{
  this->value_ += toAdd;
  return this->value_;
}