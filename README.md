# `typesift` Package

Defines a compact specification of nested object data structures. Allows a single data structure to describe a complex type which can be used to create default initial values of the structure and validation of data structures claiming to conform to a particular structure.

The idea is to use the definition to build a set of functions which take input data whish may or may not conform to the declared structure. It's simple -- dirty data in, clean data out.  Or, dirty data in, and a list of validation errors out.  This is intended to reduce the amount of wordy and repeptitive valid value checking or structure initialization and keep the defintion of the data structure complete and in one place.

## Structure of `typesift` definitions

At it's most basic level, a variable can be described by a tuple containing a type and a default value for that type.  Simple examples are `['string', [validators], 'fred']`, which describes a string variable whose default value is "fred".

The package supportes the definition of complex sub-types embedded within the `typesift` definition, such as an object, array element, or enumerated type. Sub-types are distinguished from concrete properties by prepending an underscore to the name. If the name of a particular definition starts with an underscore (`_`), the definition is ignored as a top-level property and is only references when speficied as a value of a complex type.

### Example

```
{
  property: ['string', 'a property'],
  subobject: ['object', '_subtype'],
  _subtype: {
    prop1: ['integer', 0],
    prop2: ['string', 'fred']
  }
}
```

The case above would produce the following structure as an initial value:

```
{
  property: 'a property',
  subobject: {
    prop1: 0,
    prop2: 'fred'
  }
}
```

The particular use of an embedded subtype is inferred by it's use in the defintion structure.  When used as a value, such as `['object', '_subtype']` appearing in the second slot of the tuple, the package treats the `_subtype` structure as a value to assign to the property of type `object`.  Thus, the `_subtype` object is traversed in the same way as the top-level structure, defining a set of properties and their initializers which are treated as a `typesift` definition.

When an embedded subtype is used as a type specifier (appearing in the first slot of the tuple), such as `['enum', ['_subtype', 'val']]`, the subtype definition is treated as a type with all possible values enumerated within. In the case above, the structure describes an enumerated data type whose valid values are defined as the properties of the subtype.  The above declaration would describe an enumerated type whose values are defined in `_subtype` and whose default value is `val` (which must appear in the subtype).

## Base types

| Type name | Description |
| --- | --- | 
| `boolean` | A true/false value |
| `integer` | An integer number |
| `float` | A floating point number |
| `string` | A character string | 

## Complex sub-types

| Type name | Description |
| --- | --- | 
| _`subtype`_| An enumerated type whose values are defined in an embedded sub-type |
| `array` | An ordered vector of values. Valid values of the array are defined by an embedded sub-type |
| `object` | A nested object whose value is determined by recursively traversing the provided embedded sub-type |

