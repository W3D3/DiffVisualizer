/*global $ */
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

  loadDiffsFromFile(file, filename) {
    console.log(filename);
    axios.get('/uploads/' + filename)
      .then(function(response) {
        console.log(response.data);

        response.data.forEach(function(diff) {
          console.log(diff);

          var userRepo = diff.BaseUrl.replace(/\/$/, '').replace(/^(https?:\/\/)?(github\.com\/)/, '');
          var localBaseURl = `http://localhost/github/${userRepo}`;

          var rawSrcUrl = localBaseURl + '/' + diff.ParentCommit + '/' + diff.SrcFileName;
          var rawDstUrl = localBaseURl + '/' + diff.Commit + '/' + diff.DstFileName;

          var diffTitle = diff.SrcFileName.replace(/^.*[\\\/]/, '')
          if (diff.SrcFileName != diff.DstFileName) {
            diffTitle += "</br> >> " + diff.DstFileName.replace(/^.*[\\\/]/, '')
          }

          console.log(rawSrcUrl);
          console.log(rawDstUrl);

          $('#diffsList').append(`<a href="#" class="list-group-item" id="diffItem" data-rawsrcurl="${rawSrcUrl}" data-rawdsturl="${rawDstUrl}"><b>${diffTitle}</b><br /><small>${userRepo}</small></a>`);
          // axios.get('/uploads/'+filename)
          //   .then(function (apires) {
          //
          //     $('#diffsList').append(`<a href="#" class="list-group-item" id="${diff.SrcFileName}"><h4>${diff.SrcFileName}</h4><p><small>${diff.ParentCommit} >> ${diff.Commit}</small></p></a>`);
          //   });


        });
        // for(var diff in response.data)
        // {
        //   console.log(diff);
        //
        // }

      })
      .catch(function(error) {
        console.log(error);
      });
  }

}
export default Loader;
