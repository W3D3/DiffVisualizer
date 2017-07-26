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

  initDefaults()
  {
    if (sessionStorage.length == 0) {
      this.saveSetting('lastAccess', Date.now());
    }
  }

  saveSettingPersistent(key, value)
  {
    localStorage.setItem(key, JSON.stringify(value));
  }

  loadSettingPersistent(key)
  {
    var val = localStorage.getItem(key);
    if(val == 'true'){
      return true;
    } else if(val == 'false'){
      return false;
    } else {
      return val;
    }

  }

  saveSetting(key, value)
  {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  loadSetting(key)
  {
    var val = sessionStorage.getItem(key);
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
