/* global require process */
const express = require('express');
const multer = require('multer');
const upload = multer({
    dest: 'public/uploads/'
});
const fs = require('fs');
const request = require('request');
const cors = require('cors');
const config = require('mikro-config');
const chalk = require('chalk');
const bodyParser = require('body-parser');

require('console-stamp')(console, '[HH:MM:ss.l]');
var app = express();
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.post('/diffjson', upload.single('file'), function(req, res) {
    // req.file is the file
    // req.body will hold the text fields, if there were any (nope)
    if (req.file.size > 2000000) //2MB
    {
        res.status(500).send({
            error: 'File too big!'
        });
        return;
    }
    fs.readFile('public/uploads/' + req.file.filename, 'utf8', function(err, data) {
        // if (err) {
        //   console.log(err);
        //   res.status(500).send({ error: 'There was a problem uploading the file.' });
        //   return;
        // }
        if (validateJSON(data) == false) {
            res.status(500).send({
                error: 'Not a valid json file!'
            });
            return;
        } else {
            console.info(req.file.originalname + ' - ' + req.file.mimetype);
            res.send(req.file.filename);
            return;
        }
    });
});

app.get('/github/*', cors(), function(req, res) {
    var url = 'https://raw.github.com/' + req.params[0];
    console.info(url);
    res.setHeader('Content-Type', 'text/plain');

    request.get({
        url: url,
        json: false
    }, function(err, resp, body) {
        res.send(body);
    });
});

//validator rules

app.post('/validate-githuburl', function(req, res) {
    console.info(req.body.projecturl);
    // console.info(req);
    res.setHeader('Content-Type', 'text/plain');
    // request.get({
    //     url: url,
    //     json: false
    // }, function(err, resp, body) {
    //     res.send(body);
    // });
    // res.send(false);
    res.send(JSON.stringify('Not a valid github url'));
});

//serve application
app.use(express.static('public'));
//serve uploaded files
app.use(express.static('uploads'));
app.listen(config.get('server.port'), function() {

    console.log(chalk.blue('\n ____  _  __  ____     ___                 _ _              \n' +
        '|  _ \\(_)/ _|/ _\\ \\   / (_)___ _   _  __ _| (_)_______ _ __ \n' +
        '| | | | | |_| |_ \\ \\ / /| / __| | | |/ _` | | |_  / _ \\ \'__| \n' +
        '| |_| | |  _|  _| \\ V / | \\__ \\ |_| | (_| | | |/ /  __/ |    \n' +
        '|____/|_|_| |_|    \\_/  |_|___/\\__,_|\\__,_|_|_/___\\___|_|v' + process.env.npm_package_version + '\n'));

    console.log(chalk.green('Server running and listening on: ') + chalk.bgCyan('http://localhost:' + config.get('server.port')));

    // only needed for browser-refresh package
    if (process.send) {
        process.send('online');
    }
});




function validateJSON(body) {
    try {
        JSON.parse(body);
        // if came to here, then valid
        return true;
    } catch (e) {
        // failed to parse
        return false;
    }
}
