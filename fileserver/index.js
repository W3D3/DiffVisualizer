/* global require */
var express = require('express');
var multer  = require('multer');
var upload = multer({ dest: 'public/uploads/' });
var fs = require('fs');

var app = express();

//TODO (christoph) actually check for file type/size etc
app.post('/diffjson', upload.single('file'), function (req, res, next) {
  // req.file is the file
  // req.body will hold the text fields, if there were any (nope)
  if(req.file.size > 2000000) //2MB
  {
    res.status(500).send({ error: 'File too big!' });
    return;
  }
  fs.readFile('public/uploads/'+req.file.filename, 'utf8', function (err,data) {
    // if (err) {
    //   console.log(err);
    //   res.status(500).send({ error: 'There was a problem uploading the file.' });
    //   return;
    // }
    if(validateJSON(data) == false)
    {
      res.status(500).send({ error: 'Not a valid json file!' });
      return;
    }
    else {
      console.log(req.file.originalname +  ' - ' + req.file.mimetype);
      res.send(req.file.filename);
      return;
    }
  });



});
//serve application
app.use(express.static('public'));
//serve uploaded files
app.use(express.static('uploads'));
app.listen(80);

function validateJSON(body) {
  try {
    JSON.parse(body);
    // if came to here, then valid
    return true;
  } catch(e) {
    // failed to parse
    return false;
  }
}
