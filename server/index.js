/* global require process */
const express = require('express');
const multer = require('multer');

const upload = multer({
    dest: 'public/uploads/',
});
const fs = require('fs');
const request = require('request');
const cors = require('cors');
const config = require('config');
const chalk = require('chalk');
const bodyParser = require('body-parser');
const Ajv = require('ajv');
const diffpairschema = require('./diffpairlist_schema');

require('console-stamp')(console, '[HH:MM:ss.l]');

const app = express();
app.use(bodyParser.json());

app.post('/diffjson', upload.single('file'), (req, res) => {
    // req.file is the file
    // req.body will hold the text fields, if there were any (nope)
    if (req.file.size > 2000000) { // 2MB
        res.status(500).send({
            error: 'File too big!',
        });
        return;
    }
    fs.readFile(`public/uploads/${req.file.filename}`, 'utf8', (err, data) => {
        // if (err) {
        //   console.log(err);
        //   res.status(500).send({ error: 'There was a problem uploading the file.' });
        //   return;
        // }
        if (validateJSON(data) == false) {
            res.status(500).send({
                error: 'Not a valid diff-pair-list json file!',
            });
        } else {
            console.info(`${req.file.originalname} - ${req.file.mimetype}`);
            res.send(req.file.filename);
        }
    });
});

app.get('/github/*', cors(), (req, res) => {
    const url = `https://raw.github.com/${req.params[0]}`;
    console.info(url);
    res.setHeader('Content-Type', 'text/plain');

    request.get({
        url,
        json: false,
    }, (err, resp, body) => {
        if (resp.statusCode == 404) {
            res.send('');
        } else {
            // res.status(resp.statusCode).send(body);
            res.send(body);
        }
    });
});

// validator rules

app.post('/validate-githuburl', (req, res) => {
    console.info(req.body.projecturl);
    const githubregex = /(https?:\/\/)?(www\.)?github.com\//g;
    try {
        const project = req.body.projecturl.replace(githubregex, '').split('/');
        if (project.length != 2) {
            res.status(400).send({
                message: 'Invalid format. Try user/repo or the whole github url.',
            });
            return;
        }

        const url = `https://api.github.com/repos/${project[0]}/${project[1]}`;
        console.log(url);
        res.setHeader('Content-Type', 'text/plain');
        request.get({
            url,
            json: false,
            auth: config.get('auth'),
            headers: {
                'User-Agent': 'DiffViz',
            },
        }, (err, resp, body) => {
            const commits = JSON.parse(body);
            if (resp.statusCode != 200) {
                res.status(resp.statusCode).send(commits);
            } else {
                console.log(`valid url ${url}`);
                res.status(resp.statusCode).send(commits);
            }
        });
    } catch (e) {
        res.status(500).send({
            message: 'Fatal Server Error',
        });
    }
});

app.get('/githubapi', (req, res) => {
    console.info(req.query.url);
    const githubregex = /(https?:\/\/)?(api\.)?github.com\//g;
    const string = req.query.url.replace(githubregex, '');

    const url = `https://api.github.com/${string}`;
    res.setHeader('Content-Type', 'text/plain');
    request.get({
        url,
        json: false,
        auth: config.get('auth'),
        headers: {
            'User-Agent': 'DiffViz',
        },
    }, (err, resp, body) => {
        for (const key in resp.headers) {
            if (resp.headers.hasOwnProperty(key)) {
                res.setHeader(key, resp.headers[key]);
            }
        }
        const commits = JSON.parse(body);
        if (resp.statusCode != 200) {
            res.status(resp.statusCode).send(body);
        } else {
            console.log(`valid url ${url}`);
            res.status(resp.statusCode).send(commits);
        }
    });
});


// serve application
app.use(express.static('public'));
// serve uploaded files
app.use(express.static('uploads'));

app.listen(config.get('server.port'), () => {
    console.log(chalk.blue(`${'\n ____  _  __  ____     ___                 _ _              \n' +
        '|  _ \\(_)/ _|/ _\\ \\   / (_)___ _   _  __ _| (_)_______ _ __ \n' +
        '| | | | | |_| |_ \\ \\ / /| / __| | | |/ _` | | |_  / _ \\ \'__| \n' +
        '| |_| | |  _|  _| \\ V / | \\__ \\ |_| | (_| | | |/ /  __/ |    \n' +
        '|____/|_|_| |_|    \\_/  |_|___/\\__,_|\\__,_|_|_/___\\___|_|v'}${process.env.npm_package_version}\n`));

    console.log(chalk.green('Server running and listening on: ') + chalk.bgCyan(`http://localhost:${config.get('server.port')}`));

    // only needed for browser-refresh package
    if (process.send) {
        process.send('online');
    }
});


function validateJSON(body) {
    try {
        const list = JSON.parse(body);
        const ajv = new Ajv({allErrors: true});
        console.log(body);
        const validate = ajv.compile(diffpairschema);
        const valid = validate(list);
        if (!valid) {
            console.log(validate.errors);
            return false;
        }
        return true;
    } catch (e) {
        // failed to parse
        return false;
    }
}
