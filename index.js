var express = require('express');
var app = express();
var cool = require('cool-ascii-faces');
var pg = require('pg');
var multer = require('multer');
var bodyParser = require('body-parser');
var zlib = require('zlib');
var aws      = require('aws-sdk'),
    fs       = require('fs');
var url = require('url')
var http = require('http');
var https = require('https');

var S3_ACCESS_KEY = process.env.S3_KEY;
var S3_SECRET_KEY = process.env.S3_SECRET;
var S3_BUCKET = process.env.S3_BUCKET
var UPLOAD_PATH = "./uploads/";


aws.config.update({accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY});
aws.config.httpOptions = {timeout: 60000};



// configure multer for upload management
var fileUploadCompleted = false;
var multerFiles = multer({ dest: UPLOAD_PATH,
    rename: function (fieldname, filename) {
        return filename;
    },
    onFileUploadStart: function (file) {
        console.log("Started upload of: " + file.originalname);
    },
    onFileUploadComplete: function (file) {
        console.log("Finished upload of: " + file.fieldname + " to: " + file.path);
        fileUploadCompleted = true;
    }
});


app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// create application/json parser
var jsonParser = bodyParser.json()


// ENDPOINTS
app.get('/', function(request, response) {
    //response.send('Hello World!');
    response.send(cool());
});

app.get('/db', function (request, response) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query('SELECT * FROM data_table', function(err, result) {
            done();
            if (err) {
                console.error(err);
                response.send("Error " + err);
            } else {
                response.send(result.rows);
            }
    });
  });
});

// handle uploads
app.post('/upload', multerFiles, function(req, res) {
    if (fileUploadCompleted){
        fileUploadCompleted = false;
        res.end("Upload Ok!");
    }
});

// handle upload to facebook
app.post('/uploadFacebook', function(req, res) {
    imageURL = req.body.imageURL;

    // imageURL="http://i3.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg"
    var protocol = (imageURL.startsWith('https:') ? https : http);
    protocol.get(imageURL, function(response) {
        // Send to amazon S3
        var s3obj = new aws.S3({params: {Bucket: S3_BUCKET, Key: 'image.png'}});
        s3obj.upload({Body: response}).
          on('httpUploadProgress', function(evt) { console.log(evt); }).
          send(function(err, data) { console.log(err, data) });

        // Download to file
    //   response.pipe(file);
    });
    //
    // Send local file to amazon S3
    // Create the streams
    // var read = fs.createReadStream(UPLOAD_PATH + "tip_pointer_up.png");

    // var s3obj = new aws.S3({params: {Bucket: S3_BUCKET, Key: 'image.png'}});
    // s3obj.upload({Body: read}).
    //   on('httpUploadProgress', function(evt) { console.log(evt); }).
    //   send(function(err, data) { console.log(err, data) });

    res.send("Upload Ok!");
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
