/* Checks if a dictionary key exists
 * @param dictionary : the dictionary to search through
 * @param key : the key in the dictionary
 * @param property : the key's property
 */
function keyExists (dictionary, key) {
    if (dictionary[key]) return true;
    else return false;
};

/* Checks if a dictionary key has a property value 
 * @param dictionary : the dictionary to search through
 * @param key : the key in the dictionary
 * @param property : the key's property
 */
function propertyExists (dictionary, key, property) {
    if (dictionary[key] && dictionary[key][property]) return true;
    else return false;
};

/* Checks if a property value is not empty
 * @param dictionary : the dictionary to search through
 * @param key : the key in the dictionary
 * @param property : the key's property
 */
function propertyNotEmpty (dictionary, key, property) {
    const propertyType = typeof dictionary[key][property];
    if (propertyType === "string" && dictionary[key][property] != "") return true;
    if (propertyType === "object" && dictionary[key][property] != []) return true;
    else return false;
};

module.exports = { keyExists, propertyExists, propertyNotEmpty };