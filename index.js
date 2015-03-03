var express = require('express');
var app = express();
var cool = require('cool-ascii-faces');
var pg = require('pg');
var multer = require('multer');
var bodyParser = require('body-parser');

var aws      = require('aws-sdk'),
    zlib     = require('zlib'),
    fs       = require('fs');

var S3_ACCESS_KEY = process.env.S3_KEY;
var S3_SECRET_KEY = process.env.S3_SECRET;
var S3_BUCKET = process.env.S3_BUCKET

aws.config.update({accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY});

s3Stream = require('s3-upload-stream')(new aws.S3());

var UPLOAD_PATH = "./uploads/";


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
    // Create the streams
    var read = fs.createReadStream(UPLOAD_PATH + "tip_pointer_up.png");
    var compress = zlib.createGzip();
    var upload = s3Stream.upload({
        "Bucket": S3_BUCKET,
        "Key": "image.png"
    });

    // Handle errors.
    upload.on('error', function (error) {
      console.log(error);
    });

    // Handle progress.
    upload.on('part', function (details) {
      console.log(details);
    });

    // Handle upload completion.
    upload.on('uploaded', function (details) {
      console.log(details);
    });

    // Pipe the incoming filestream through compression, and up to S3.
    read.pipe(compress).pipe(upload);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
