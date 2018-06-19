var a = {
    string: "a_string_1",
    number: 1,
    subObject: {
        string: "a_subObject_string_1",
        number: 2
    }
}

var b = {
    string: "b_string_2",
    number1: 2,
    subObject: {
        string: "b_subObject_string_1",
        number1: 2
    }
}

Ext.apply(a, b);
console.log(a);

// {
//     "string": "b_string_2",
//     "number": 1,
//     "subObject": {
//         "string": "b_subObject_string_1",
//         "number1": 2
//     },
//     "number1": 2
// }