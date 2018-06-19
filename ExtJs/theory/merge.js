/**
 * Merges any number of objects recursively without referencing them or their children.
 *
 *     var extjs = {
 *         companyName: 'Ext JS',
 *         products: ['Ext JS', 'Ext GWT', 'Ext Designer'],
 *         isSuperCool: true,
 *         office: {
 *             size: 2000,
 *             location: 'Palo Alto',
 *             isFun: true
 *         }
 *     };
 *
 *     var newStuff = {
 *         companyName: 'Sencha Inc.',
 *         products: ['Ext JS', 'Ext GWT', 'Ext Designer', 'Sencha Touch', 'Sencha Animator'],
 *         office: {
 *             size: 40000,
 *             location: 'Redwood City'
 *         }
 *     };
 *
 *     var sencha = Ext.Object.merge(extjs, newStuff);
 *
 *     // extjs and sencha then equals to
 *     {
 *         companyName: 'Sencha Inc.',
 *         products: ['Ext JS', 'Ext GWT', 'Ext Designer', 'Sencha Touch', 'Sencha Animator'],
 *         isSuperCool: true,
 *         office: {
 *             size: 40000,
 *             location: 'Redwood City',
 *             isFun: true
 *         }
 *     }
 *
 * @param {Object} destination The object into which all subsequent objects are merged.
 * @param {Object...} object Any number of objects to merge into the destination.
 * @return {Object} merged The destination object with all passed objects merged in.
 */
merge: function(destination) {
    var i = 1,
        args = arguments,
        ln = args.length,
        mergeFn = ExtObject.merge,
        cloneFn = Ext.clone,
        object, key, value, sourceKey;

    for (; i < ln; i++) {
        object = args[i];

        for (key in object) {
            value = object[key];
            if (value && value.constructor === Object) {
                sourceKey = destination[key];
                if (sourceKey && sourceKey.constructor === Object) {
                    mergeFn(sourceKey, value);
                } else {
                    destination[key] = cloneFn(value);
                }
            } else {
                destination[key] = value;
            }
        }
    }

    return destination;
},