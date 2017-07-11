/*global $ */
import Utility from './Utility';
import Dropzone from 'dropzone';
import axios from 'axios';

class Loader {
  constructor() {
    //Configure dropzone
    Dropzone.options.jsonUploader = {
      paramName: 'file', // The name that will be used to transfer the file
      maxFilesize: 2, // MB
      accept: function(file, done) {
        //accept all files for now
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

  loadDiffsFromFile(file, filename) {
    $('#diffsList').html('');
    axios.get('/uploads/' + filename)
      .then(function(response) {

        response.data.forEach(function(diff) {

          var userRepo = diff.BaseUrl.replace(/\/$/, '').replace(/^(https?:\/\/)?(github\.com\/)/, '');
          var localBaseURl = `http://${window.location.host}/github/${userRepo}`;

          var rawSrcUrl = localBaseURl + '/' + diff.ParentCommit + '/' + diff.SrcFileName;
          var rawDstUrl = localBaseURl + '/' + diff.Commit + '/' + diff.DstFileName;

          var diffTitle = diff.SrcFileName.replace(/^.*[\\\/]/, '');
          var diffDstTitle = diff.SrcFileName.replace(/^.*[\\\/]/, '');
          if (diff.SrcFileName != diff.DstFileName) {
            diffTitle += '</br> >> ' + diffDstTitle;
          }

          $('#diffsList').append(`<a href="#" class="list-group-item" id="diffItem" data-rawsrcurl="${rawSrcUrl}" data-rawdsturl="${rawDstUrl}" data-id="${diff.Id}"><span class="label label-default">${diff.Id}</span><b> ${diffTitle}</b><br /><small>${userRepo}</small></a>`);

        });
      })
      .catch(function(error) {
        Utility.showError(error);
      });
  }

}
export default Loader;
