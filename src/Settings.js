/* global $ */
import Utility from './Utility';

class Settings {

  constructor() {
    if (typeof(Storage) !== undefined) {
        this.saveSetting('lastAccess', Date.now());
        //Utility.showMessage('storage activated');
    } else {
        Utility.showError('No Web Storage support! Settings will not be saved permanently');
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
      return val;
    }

  }

}
export default Settings;
