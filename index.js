var express = require('express');
var app = express();
var cool = require('cool-ascii-faces');
var pg = require('pg');
var multer = require('multer');

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

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
