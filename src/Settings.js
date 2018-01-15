/* global */
/**
 * @file Settings used to save Data temporarily or persistently
 * @author Christoph Wedenig <christoph@wedenig.org>
 */
import Utility from './Utility';
import {
    version,
} from '../package.json';

class Settings {
    static filePrefix() {
        return 'savedJSONFiles_';
    }

    static initDefaults() {
        if (typeof (Storage) != 'undefined') {
            if (Settings.loadSettingPersistent('version') == null) {
                // first start
                Settings.clearPersistentStorage();
            } else if (Settings.loadSettingPersistent('version').split('.').join('') < 190) {
                // not compatible with version 1.8.1 and below
                Utility.showWarning('Not compatible with version 1.8.1 and below, settings will be reset.');
                Settings.clearPersistentStorage();
            }
            Settings.saveSettingPersistent('version', version);
        } else {
            Utility.showError('No Web Storage support! Settings will not be saved permanently');
        }
    }

    static saveSettingPersistent(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static loadSettingPersistent(key) {
        const val = localStorage.getItem(key);
        if (val == 'true') {
            return true;
        } else if (val == 'false') {
            return false;
        }
        return JSON.parse(val);
    }

    static getAllSettingsPersistent() {
        const arr = [];
        for (let i = 0; i < localStorage.length; i++) {
            arr[i] = localStorage.getItem(localStorage.key(i));
        }
        return arr;
    }

    static deleteSettingPersistent(key) {
        localStorage.removeItem(key);
    }

    static getAllSettingsKeysPersistent() {
        const arr = [];
        for (let i = 0; i < localStorage.length; i++) {
            arr[i] = localStorage.key(i);
        }
        return arr;
    }

    static saveFile(filename, contents) {
        Settings.saveSettingPersistent(Settings.filePrefix() + filename, contents);
    }

    static loadFile(filename) {
        return Settings.loadSettingPersistent(Settings.filePrefix() + filename);
    }

    static deleteFile(filename) {
        return Settings.deleteSettingPersistent(Settings.filePrefix() + filename);
    }

    static getAllFiles() {
        const arr = Settings.getAllSettingsKeysPersistent();
        const regex = new RegExp(`^${Settings.filePrefix()}`, 'g');
        return arr.map((e) => {
            if (e.match(regex)) {
                return e.replace(Settings.filePrefix(), '');
            }
            return undefined;
        }).filter(item => typeof item !== 'undefined');
    }

    static clearPersistentStorage() {
        localStorage.clear();
    }

    static saveSetting(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    }

    static loadSetting(key) {
        const val = sessionStorage.getItem(key);
        if (val == 'true') {
            return true;
        } else if (val == 'false') {
            return false;
        }
        return JSON.parse(val);
    }
}
export default Settings;
