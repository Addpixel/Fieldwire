# Fieldwire

![](https://rawgit.com/addpixel/Fieldwire/master/logo.svg)

Conditional Input-Fields for [Processwire](https://github.com/ryancramerdesign/ProcessWire) Frontend – ***without jQuery UI***.

Fieldwire is a replacement for [Processwires Inputfield Dependencies](http://processwire.com/api/selectors/inputfield-dependencies/ "Inputfield Dependencies"). It supports all [comparison-operators used by Processwire](http://processwire.com/api/selectors/inputfield-dependencies/#operators) (`=`, `!=`, `>`, `<`, `>=`, `<=`, `%=` and `*=`).

![](https://rawgit.com/addpixel/Fieldwire/master/fieldwire_in_action.gif)

## Examples

```
age>=18
email*=@gmail.com
textfield!=''
checkbox=1
price>=10,price<100
```

## Support

Fieldwire depends on [jQuery](http://jquery.com) (2.x.x or 1.x.x) but eliminates the need for jQuery UI. Fieldwire works with the following FormBuilder field types.

- [X] Fieldset
- [X] Text
- [X] Textarea
- [X] Radio Buttons
- [X] Checkbox
- [X] Select
- [X] File
- [X] E-Mail
- [X] URL
- [X] Integer
- [X] Float
- [X] Datetime

Other field-types may work, but are not (yet) officially supported by Fieldwire.
