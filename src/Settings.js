/* global $ */
/**
 * @file Settings used to save Data temporarily or persistently
 * @author Christoph Wedenig <christoph@wedenig.org>
 */
import Utility from './Utility';

class Settings {

    constructor() {
        if (typeof(Storage) !== undefined) {
            this.initDefaults();
        //Utility.showMessage('storage activated');
        } else {
            Utility.showError('No Web Storage support! Settings will not be saved permanently');
        }
    }

    initDefaults() {
        if (sessionStorage.length == 0) {
            this.saveSetting('lastAccess', Date.now());
        }
    }

    static saveSettingPersistent(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static loadSettingPersistent(key) {
        var val = localStorage.getItem(key);
        if(val == 'true'){
            return true;
        } else if(val == 'false'){
            return false;
        } else {
            return JSON.parse(val);
        }

    }

    static getAllSettingsPersistent() {
        var arr = [];
        for (var i = 0; i < localStorage.length; i++){
            arr[i] = localStorage.getItem(localStorage.key(i));
        }
        return arr;
    }

    static getAllSettingsKeysPersistent() {
        var arr = [];
        for (var i = 0; i < localStorage.length; i++){
            arr[i] = localStorage.key(i);
        }
        return arr;
    }

    saveSetting(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    }

    loadSetting(key) {
        var val = sessionStorage.getItem(key);
        if(val == 'true'){
            return true;
        } else if(val == 'false'){
            return false;
        } else {
            return JSON.parse(val);
        }

    }

    parseSetting(val) {
        if(val == 'true'){
            return true;
        } else if(val == 'false'){
            return false;
        } else {
            return JSON.parse(val);
        }
    }

}
export default Settings;
