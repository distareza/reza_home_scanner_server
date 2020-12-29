var http = require('http');
var fs = require('fs');
var url = require("url");
var path = require("path");
var port = process.argv[2] || 8080;

const execSync = require('child_process').execSync;
const books = JSON.stringify([
    { title: "The Alchemist", author: "Paulo Coelho", year: 1988 },
    { title: "The Prophet", author: "Kahlil Gibran", year: 1923 }
]);

const scanned_path = "/share/"
const pdf_icon_file = "/home/pi/MyScripts/images/PDFImageIcon.png"

http.createServer(function (request, response) {
  console.log("request url : " + request.url);

  switch (url.parse(request.url, true).pathname) {
    case "/getScannerName":
      console.log("Get Scanner Name");
      try {
      	var output = execSync("scanimage -L").toString();
      	console.log(`stdout: ${output}`);
      	response.setHeader("Content-Type", "application/json");
      	response.writeHead(200);
      	response.end(JSON.stringify({status:"ok", message: output}));
      } catch (e) {
      	console.error(e);
      	response.setHeader("Content-Type", "application/json");
      	response.writeHead(400);
      	response.end(JSON.stringify({status: "error", message: e.message }));
      }
      return

    case "/scandocument":
      console.log("start Scan Document From Scanner");
      var scanResult = JSON.stringify([{status:"init", message: "initial"}]);

      var now = new Date();
      let fileName = "scanfile_" + now.getFullYear() + (now.getMonth() + 1) + now.getDate() + now.getHours() + now.getMinutes() + now.getSeconds() + now.getMilliseconds() + ".jpg";
      console.log("file Name : " + fileName);

      try {
      	var result = execSync("scanimage -d \"pixma:04A9176D_A74385\" --resolution 300 -x 2550 -y 3300 --format jpeg > " + scanned_path + fileName).toString();
      	var message = "scan complete - " + fileName + " - " + result;
      	console.log(`stdout: ${message}`);

      	response.setHeader("Content-Type", "application/json");
      	response.writeHead(200);
      	response.end(JSON.stringify({status:"ok", message: message}));
      } catch (e) {
      	console.error(e);
      	response.setHeader("Content-Type", "application/json");
      	response.writeHead(400);
      	response.end(JSON.stringify({status: "error", message: e.message }));
      }
      return

    case "/showdocuments":
          // directory path
      const dir = '/share/';

      // list all files in the directory
      try {
      	const files = fs.readdirSync(dir);

      	// files object contains all files names
      	// log them on console
      	//files.forEach(file => {
      	//	console.log(file);
      	//});

      	response.setHeader("Content-Type", "application/json");
      	response.writeHead(200);
      	response.end(JSON.stringify(files));

      } catch (err) {
      	console.error(err);
      	response.setHeader("Content-Type", "application/json");
      	response.writeHead(400);
      	response.end(JSON.stringify({status: "error", message: err.message }));
      }

      return
      break

		case "/deletedocument":
			var query = url.parse(request.url, true).query;
			var fileToDelete = query.fileid;
			console.log("file to delete : "  + fileToDelete);

			try {

				if ( fileToDelete == undefined )
					throw new Error("File To Delete is not recognized");

				fs.unlink(scanned_path + fileToDelete, function (err) {
					if (err) throw err;
					  console.log('File ' + fileToDelete + ' deleted!');
				});

				response.setHeader("Content-Type", "application/json");
				response.writeHead(200);
				response.end(JSON.stringify({status: "ok", message: "File " + fileToDelete + " deleted"}));
				return;
			} catch (err) {
				console.error(err);
				response.setHeader("Content-Type", "application/json");
				response.writeHead(400);
				response.end(JSON.stringify({status: "error", message: err.message }));
				return;
			}
			break

    case "/deletealldocument":
			console.log("delete all document: ");

			try {
        var cmd = "rm -f " + scanned_path + "* ";
        console.log(`cmd: ${cmd}`);
        var output = execSync(cmd).toString();
      	console.log(`stdout: ${output}`);

				response.setHeader("Content-Type", "application/json");
				response.writeHead(200);
				response.end(JSON.stringify({status: "ok", message:"All files are deleted"}));
				return;
			} catch (err) {
				console.error(err);
				response.setHeader("Content-Type", "application/json");
				response.writeHead(400);
				response.end(JSON.stringify({status: "error", message: err.message }));
				return;
			}
			break

    case "/convertPDF":
      console.log("Convert To PDF");
      try {
        var now = new Date();
        let fileName = "scanfile_" + now.getFullYear() + (now.getMonth() + 1) + now.getDate() + now.getHours() + now.getMinutes() + now.getSeconds() + now.getMilliseconds() + ".pdf";
        console.log("file Name : " + fileName);
      	var output = execSync("convert " + scanned_path + "*.jpg " + scanned_path + fileName).toString();
      	console.log(`stdout: ${output}`);
      	response.setHeader("Content-Type", "application/json");
      	response.writeHead(200);
      	response.end(JSON.stringify({status:"ok", message: "Successfully Converted to " + fileName}));
      } catch (e) {
      	console.error(e);
      	response.setHeader("Content-Type", "application/json");
      	response.writeHead(400);
      	response.end(JSON.stringify({status: "error", message: e.message }));
      }
      return

		case "/showImage":
			var query = url.parse(request.url, true).query;
			var fileImageName = query.fileName;
			console.log("image File : "  + fileImageName);

			try {
        var fileExt = path.extname(fileImageName);
        console.log("file Ext : " + fileExt);
        if (fileExt == ".jpg") {
  				var imageData = fs.readFileSync(scanned_path + fileImageName);
  				response.writeHead(200, {"Content-Type": "image/jpg"});
  				response.write(imageData, "binary");
  				response.end();
        } if (fileExt == ".pdf") {
          var imageData = fs.readFileSync(pdf_icon_file);
  				response.writeHead(200, {"Content-Type": "image/png"});
  				response.write(imageData, "binary");
  				response.end();
        }
				return;
			} catch (err) {
				console.error(err);
				response.setHeader("Content-Type", "application/json");
				response.writeHead(400);
				response.end(JSON.stringify({status: "error", message: err.message }));
				return;
			}
			break;

      case "/getFile":
  			var query = url.parse(request.url, true).query;
  			var fileImageName = query.fileName;
  			console.log("image File : "  + fileImageName);

  			try {
          var fileExt = path.extname(fileImageName);
          console.log("file Ext : " + fileExt);
          if (fileExt == ".jpg") {
    				var imageData = fs.readFileSync(scanned_path + fileImageName);
    				response.writeHead(200, {"Content-Type": "image/jpg"});
    				response.write(imageData, "binary");
    				response.end();
          } if (fileExt == ".pdf") {
            var imageData = fs.readFileSync(scanned_path + fileImageName);
    				response.writeHead(200, {"Content-Type": "application/pdf"});
    				response.write(imageData, "binary");
    				response.end();
          }
  				return;
  			} catch (err) {
  				console.error(err);
  				response.setHeader("Content-Type", "application/json");
  				response.writeHead(400);
  				response.end(JSON.stringify({status: "error", message: err.message }));
  				return;
  			}
  			break;

		default:
    }

	var uri = url.parse(request.url).pathname, filename = path.join(process.cwd(), uri);

	var contentTypesByExtension = {
		'.html': "text/html",
		'.css':  "text/css",
		'.js':   "text/javascript",
		'.jpg':   "image/jpg"
	};

/**
	fs.readFile('index.html', function(err, data) {
		response.writeHead(200, {'Content-Type': 'text/html'});
		response.write(data);
		return response.end();
	});
**/



  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      var headers = {};
      var contentType = contentTypesByExtension[path.extname(filename)];
      if (contentType) headers["Content-Type"] = contentType;
      response.writeHead(200, headers);
      response.write(file, "binary");
      response.end();
    });
  });

}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
