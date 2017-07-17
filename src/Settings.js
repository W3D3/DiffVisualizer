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

  saveSetting(key, value)
  {
    localStorage.setItem(key, value);
  }

  loadSetting(key)
  {
    localStorage.getItem(key);
  }

}
export default Settings;
