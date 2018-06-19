console.log(Ext.isFunction(null));         //false
console.log(Ext.isFunction(undefined));    //false
console.log(Ext.isFunction({}));           //false
console.log(Ext.isFunction([]));           //false
console.log(Ext.isFunction(""));           //false
console.log(Ext.isFunction(""));           //false
console.log(Ext.isFunction(function(){})); //true