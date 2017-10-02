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
        //var me = this;
        Loader.loadedDiffObjects = [];
        //Configure dropzone
        Dropzone.options.jsonUploader = {
            paramName: 'file', // The name that will be used to transfer the file
            dictDefaultMessage: 'Import as JSON file (Drag and Drop)',
            maxFilesize: 2, // MB
            accept: function(file, done) {
                //accept all files for now
                //console.log(file);
                NProgress.configure({
                    parent: '#jsonUploader'
                });
                NProgress.start();
                done();
            },
            acceptedFiles: '.json',
            maxFiles: 1,
            success: Loader.loadDiffsFromFile,
            error: function(file, err, xhr) {
                //console.log(file);
                NProgress.done();
                this.removeAllFiles();

                if (xhr) {
                    Utility.showError('Error parsing file - ' + err.error);
                    return;
                }

                Utility.showWarning('Invalid filetype. Only .json is allowed.');


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
        //var me = this;
        var alreadyUploaded = Settings.getAllFiles();
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

    static loadDiffsFromFile(file, filename) {
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

    static createDiffList(data, append) {
        //ar me = this;
        if(!append) $('#diffsList').html('');
        data.forEach(function(diff) {

            var userRepo = diff.BaseUrl.replace(/\/$/, '').replace(/^(https?:\/\/)?(github\.com\/)/, '');
            var localBaseURl = `http://${window.location.host}/github/${userRepo}`;

            var rawSrcUrl = localBaseURl + '/' + diff.ParentCommit + '/' + diff.SrcFileName;
            var rawDstUrl = localBaseURl + '/' + diff.Commit + '/' + diff.DstFileName;

            var diffTitle = diff.SrcFileName.replace(/^.*[\\\/]/, '');
            var diffDstTitle = diff.DstFileName.replace(/^.*[\\\/]/, '');
            if (diff.SrcFileName != diff.DstFileName) {
                diffTitle += '</br> &#8658; ' + diffDstTitle;
            }

            Loader.loadedDiffObjects.push(diff);
            $('#diffsList').append(`<a href="#" class="list-group-item" id="diffItem" data-rawsrcurl="${rawSrcUrl}" data-rawdsturl="${rawDstUrl}" data-id="${diff.Id}"><span class="label label-default">${String(diff.Id).substring(0,8)}</span><b> ${diffTitle}</b><br /><small>${userRepo}</small></a>`);

        });
        GUI.recalcDiffListHeight();
        NProgress.done();
    }

}
export default Loader;
