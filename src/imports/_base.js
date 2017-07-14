const VIEWMODELS_PATH = __dirname + '/viewmodels/'
const IMPORTS_PATH = __dirname + '/imports/'
const COMPONENTS_PATH = VIEWMODELS_PATH + 'components/'
const TEMPLATES_PATH = VIEWMODELS_PATH + 'templates/'
const DEFAULT_SCHOOL_LOGO = 'resx/images/school-logo.png'

const SERVER = 'SERVER'
const CLIENT = 'CLIENT'

const MENU_GLOBAL = 'MENU-GLOBAL'
const MENU_ADMIN = 'MENU-ADMIN'
const MENU_SUPER = 'MENU-SUPER'
const MENU_TEACHER = 'MENU-TEACHER'

const TERM_LABELS = ['First', 'Second', 'Third', 'Fourth', 'Fifth']

const fs = require('fs')
const ko = require('knockout')
const $ = require('jquery')
const _ = require('lodash')
const {ajs} = require(IMPORTS_PATH + 'ext/anim-js.min.js')
const {Component} = require(COMPONENTS_PATH + '_compo_.js')
const api = require(IMPORTS_PATH + '_api.js')
const db = require(IMPORTS_PATH + '_db.js')
const _server = require(IMPORTS_PATH + '_server.js')
const {remote, BrowserWindow} = require('electron')
const app = remote.getGlobal('thisApp')
const currentWindow = remote.getCurrentWindow()

const USERDATA_ASSETS_PATH = app.getPath('userData') + '/assets/'

require('jquery-match-height')

/**
 * Randomly generates a number within given range
 * @param {int} min The inclusive minimum
 * @param {int} max The inclusive maximum
 */
function _random(min = 0, max = 9999999999999) {
    return Math.ceil(Math.random() * (max - min) + min);
}

/**
 * Useful in helping the faux-compiler determine if double quotes are escaped
 * @private
 * @param {object} data
 */
function _backslashCompliant(data) {
    for (let i in data) {
        let d = data[i].toString();
        let m = d.match(/"/gi);
        if (!m) 
            continue;
        
        let p = d.match(/\\"/gi);
        if (!p) 
            return false;
        if (m.length != p.length) 
            return false;
        }
    return true;
}

/**
 * Wrapper for fetching template for specified component
 * @param {string} name
 */
function _getComponentView(name) {
    return fs.readFileSync(TEMPLATES_PATH + name + '.html', 'utf8')
}

/**
 * Wrapper for loading a ko component
 * @param {string} name
 * @param {object} component
 */
function _loadComponent(name, component) {
    let _c = {
        viewModel: component,
        template: _getComponentView(name)
    }
    ko
        .components
        .register(name, _c)
}

/**
 * Determines if any of supplied fields is empty
 * @param {array} fields
 */
function _anyEmpty(...fields) {
    let _empty = false
    fields.forEach(items => {
        if (!items || items.toString().trim().length === 0) 
            _empty = true
    })
    return _empty
}

/**
 * Resets a form
 * @param {string} formSelector The jquery selector to use, including the notation
 */
function _resetForm(formSelector) {
    $(':input', formSelector)
        .removeAttr('checked')
        .removeAttr('selected')
        .not(':button, :submit, :reset, :hidden, :radio, :checkbox')
        .val('');
}

/**
 * Returns the UTC timestamp
 */
function _getUTCTime() {
    let d = new Date()
    return Date.parse(d.toUTCString())
}

/**
 * Convenience function for saving logo
 * @param {object} data Object containing buffer and salt
 */
function _saveLogo(data) {
    if (!fs.existsSync(USERDATA_ASSETS_PATH)) // create the assets directory if it doesn't exist yet
        fs.mkdirSync(USERDATA_ASSETS_PATH)
    fs.writeFile(USERDATA_ASSETS_PATH + 'logo.jpg', data.buf, 'binary', e => {})

    // save up the salt
    let DbSettings = db('settings')
    DbSettings
        .iu({label: 'logoSalt', value: data.salt})
        .then(() => {})
        .catch(() => {})
}

/**
 * Generates a random hash
 */
function _hash() {
    let hash = require('crypto').createHash('sha256')
    hash.update(_getUTCTime().toString())
    return hash.digest('hex')
}

/**
 * Password reveal logic
 */
$('body')
    .on('click', '.pwd-btn', function () {
        let $parent = $(this).parent()
        $('input', $parent).attr('type', $parent.hasClass('seen')
            ? 'password'
            : 'text')
        $parent.toggleClass('seen')
    })

/**
 * A depth-inclusive match extension for javascript string
 * @param   {RegExp} regex The regex pattern to match against
 * @returns {Array}  Array of (arrays) matches
 */
String.prototype.matches = function (regex) {
    let matches = [];
    let str = this.toString();
    while (str.length > 0) {
        let m = str.match(regex);
        if (!m) 
            break;
        let ms = [];
        for (let i = 0; i < m.length; i++) 
            ms.push(m[i]);
        str = str.substring(m.index + m[0].length);
        matches.push(ms);
    }
    return (matches);
}

/**
 * The sprintf String extension for javascript
 * @param   {Array|object} [replacement_map] The replacement map to use for the operation
 * @returns {string}       The string with values substituted
 */
String.prototype.sprintf = function (replacement_map) {
    replacement_map = replacement_map || {};
    let s = this.toString();
    let matches = s.matches(/#\{([^\{\}]*)\}/);
    matches.map((m, i) => {
        if (Array.isArray(replacement_map)) {
            if (replacement_map[i]) 
                s = s.replace(m[0], replacement_map[i]);
            }
        else {
            if (replacement_map[m[1]]) 
                s = s.replace(m[0], replacement_map[m[1]]);
            }
        });
    return s;
}

/**
 * Add ability to extend functions with properties
 */
Function.prototype.extend = function (args) {
    if (Array.isArray(args) || (args !== null && typeof args === 'object')) {
        for (let i in args) {
            this[i] = args[i];
        }
    }
    return this;
};