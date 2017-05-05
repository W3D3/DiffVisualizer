import Dropzone from 'Dropzone';
import axios from 'axios';

class Loader {
  constructor() {
    //Configure dropzone
    Dropzone.options.jsonUploader = {
    paramName: 'file', // The name that will be used to transfer the file
    maxFilesize: 2, // MB
    accept: function(file, done) {
      // if (file.name == 'aau.json') {
      //   done('Naha, you don\'t.');
      // }
      // else { done(); }
      done();
    },
    acceptedFiles: '.json',
    maxFiles: 1,
    success: this.loadDiffsFromFile,
    maxfilesexceeded: function(file) {
        this.removeAllFiles();
        this.addFile(file);
    }
  };

  }

  loadDiffsFromFile(file, filename)
  {
    console.log(filename);
    axios.get('/uploads/'+filename)
      .then(function (response) {
        console.log(response.data);

        response.data.forEach(function(diff) {
            console.log(diff);
        });
        // for(var diff in response.data)
        // {
        //   console.log(diff);
        //
        // }

      })
      .catch(function (error) {
        console.log(error);
      });
  }
}
export default Loader;
