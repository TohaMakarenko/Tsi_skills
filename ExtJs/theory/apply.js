enumerables = [//'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 
                       'valueOf', 'toLocaleString', 'toString', 'constructor'],

/**
 * Copies all the properties of `config` to the specified `object`. There are two levels
 * of defaulting supported:
 * 
 *      Ext.apply(obj, { a: 1 }, { a: 2 });
 *      //obj.a === 1
 * 
 *      Ext.apply(obj, {  }, { a: 2 });
 *      //obj.a === 2
 * 
 * Note that if recursive merging and cloning without referencing the original objects
 * or arrays is needed, use {@link Ext.Object#merge} instead.
 * 
 * @param {Object} object The receiver of the properties.
 * @param {Object} config The primary source of the properties.
 * @param {Object} [defaults] An object that will also be applied for default values.
 * @return {Object} returns `object`.
 */
Ext.apply = function (object, config, defaults) {
    if (object) {
        if (defaults) {
            Ext.apply(object, defaults);
        }

        if (config && typeof config === 'object') {
            var i, j, k;

            for (i in config) {
                object[i] = config[i];
            }

            if (enumerables) {
                for (j = enumerables.length; j--;) {
                    k = enumerables[j];
                    if (config.hasOwnProperty(k)) {
                        object[k] = config[k];
                    }
                }
            }
        }
    }

    return object;
};