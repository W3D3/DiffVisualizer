/* global $ */
/**
 * @file Uploading and parsing JSON diff lists
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

import Utility from './Utility';
import GUI from './GUI';
import Settings from './Settings';
import Dropzone from 'dropzone';
import axios from 'axios';
import NProgress from 'nprogress';

class Loader {
    constructor() {
        //Configure dropzone
        Dropzone.options.jsonUploader = {
            paramName: 'file', // The name that will be used to transfer the file
            maxFilesize: 2, // MB
            accept: function(file, done) {
                //accept all files for now
                NProgress.configure({
                    parent: '#jsonUploader'
                });
                NProgress.start();
                done();
            },
            acceptedFiles: '.json',
            maxFiles: 1,
            success: this.loadDiffsFromFile,
            error: function(file, err, xhr) {
                if (xhr) {
                    NProgress.done();
                    Utility.showError('Error parsing file - ' + err.error);
                    this.removeAllFiles();
                }

            },
            maxfilesexceeded: function(file) {
                this.removeAllFiles();
                this.addFile(file);
            }
        };

        //show all the already uploaded elements
        Loader.showUploadedElements();
    }

    static showUploadedElements() {
        var alreadyUploaded = Settings.getAllFiles();
        console.log(alreadyUploaded);
        $('#uploadedFiles').html('');
        alreadyUploaded.forEach(filename => {
            $('#uploadedFiles').append(`<a href="#" class="list-group-item fileButton" data-key="${filename}"> ${filename}</a>`);
            //<i class="fa fa-times pull-right" style="color: red"></i></a>
        });

        $('.fileButton').on('click', function() {
            NProgress.configure({
                parent: '#uploadedFiles'
            });
            NProgress.start();
            $(this).parent().find('.fileButton').removeClass('active');
            $(this).addClass('active');
            Loader.createDiffList(Settings.loadFile($(this).data('key')));
            Utility.showSuccess('Finished loading <i>' + $(this).data('key') + '</i>');
        });
    }

    loadDiffsFromFile(file, filename) {
        axios.get('/uploads/' + filename)
            .then(response => {
                Settings.saveFile(file.name, response.data);
                Loader.showUploadedElements();
                Loader.createDiffList(response.data);

                Utility.showSuccess('Finished importing <i>' + file.name + '</i>');
            })
            .catch(function(error) {
                Utility.showError(error);
                NProgress.done();
            });
    }

    static createDiffList(data) {
        $('#diffsList').html('');
        data.forEach(function(diff) {

            var userRepo = diff.BaseUrl.replace(/\/$/, '').replace(/^(https?:\/\/)?(github\.com\/)/, '');
            var localBaseURl = `http://${window.location.host}/github/${userRepo}`;

            var rawSrcUrl = localBaseURl + '/' + diff.ParentCommit + '/' + diff.SrcFileName;
            var rawDstUrl = localBaseURl + '/' + diff.Commit + '/' + diff.DstFileName;

            var diffTitle = diff.SrcFileName.replace(/^.*[\\\/]/, '');
            var diffDstTitle = diff.DstFileName.replace(/^.*[\\\/]/, '');
            if (diff.SrcFileName != diff.DstFileName) {
                diffTitle += '</br> >> ' + diffDstTitle;
            }

            $('#diffsList').append(`<a href="#" class="list-group-item" id="diffItem" data-rawsrcurl="${rawSrcUrl}" data-rawdsturl="${rawDstUrl}" data-id="${diff.Id}"><span class="label label-default">${diff.Id}</span><b> ${diffTitle}</b><br /><small>${userRepo}</small></a>`);

        });
        GUI.recalcDiffListHeight();
        NProgress.done();
    }

}
export default Loader;
