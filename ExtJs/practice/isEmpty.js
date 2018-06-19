console.log(Ext.isEmpty(null));         //true
console.log(Ext.isEmpty(undefined));    //true
console.log(Ext.isEmpty({}));           //false
console.log(Ext.isEmpty([]));           //true
console.log(Ext.isEmpty(""));           //true
console.log(Ext.isEmpty("",true));      //false
console.log(Ext.isEmpty(function(){})); //false