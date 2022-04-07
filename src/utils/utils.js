/**
 * @param {object} defaultOptions 
 * @param {object} options 
 * @returns {object}
 */
module.exports.bindOptions = (defaultOptions, options) => {
    if (!options) return defaultOptions;
    if (!defaultOptions) return options;
    const result = { ...defaultOptions };
    for (const option of getValuesWithPath(options)) {
        const { path, value } = option;

        // もしパスが途中で途切れていたら、その奥は直接コピーする
        if (!hasPath(result, path)) {
            for (var i = 0; i < path.length; i++) {
                const checkPath = path.slice(0, i + 1);
                if (!hasPath(result, checkPath)) {
                    const resultPath = checkPath.slice(0, -1);
                    const object = resultPath.reduce((acc, key) => acc[key], result);
                    setPath(object, path.slice(i), value);
                    break;
                }
            }
        } else {
            const last = path.pop();
            const object = path.reduce((acc, key) => acc[key], result);
            object[last] = value;
        }

    }
    return result;
}

/** 
 * @private
 * @param {object} object 
 * @returns {{path: string[], value: any}[]}
 */
function getValuesWithPath(object, path = []) {
    const result = [];
    for (const key of Object.keys(object)) {
        const value = object[key];
        const newPath = [...path, key];
        if (typeof value === "object" && !Array.isArray(value)) {
            result.push(...getValuesWithPath(value, newPath));
        } else {
            result.push({ path: newPath, value: value });
        }
    }
    return result;
}

/**
 * @param {object} object
 * @param {string[]} path
 * @returns {boolean}
 */
function hasPath(object, path) {
    for (const key of path) {
        if (!object.hasOwnProperty(key)) {
            return false;
        }
        object = object[key];
    }
    return true;
}

/**
 * @param {object} object 
 * @param {string[]} path 
 * @param {*} value 
 */
function setPath(object, path, value) {
    for (const key of path) {
        if (!object.hasOwnProperty(key)) {
            object = object[key];
        } else {
            object = object[key] = {};
        }
    }
    object[path[path.length - 1]] = value;
}

/** @returns {string} */
module.exports.generateUuid = () => {
    var chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
    for (var i = 0; i < chars.length; i++) {
        switch (chars[i]) {
            case "x":
                chars[i] = Math.floor(Math.random() * 16).toString(16);
                break;
            case "y":
                chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                break;
        }
    }
    return chars.join("");
}