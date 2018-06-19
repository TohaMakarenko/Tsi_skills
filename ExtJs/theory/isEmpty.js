/**
 * Returns true if the passed value is empty, false otherwise. The value is deemed to be empty if it is either:
 *
 * - `null`
 * - `undefined`
 * - a zero-length array
 * - a zero-length string (Unless the `allowEmptyString` parameter is set to `true`)
 *
 * @param {Object} value The value to test.
 * @param {Boolean} [allowEmptyString=false] `true` to allow empty strings.
 * @return {Boolean}
 */
isEmpty: function(value, allowEmptyString) {
    return (value == null) || (!allowEmptyString ? value === '' : false) || (Ext.isArray(value) && value.length === 0);
},