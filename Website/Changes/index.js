var express = require('express');
var app = express();
const fs = require('fs');
var cors = require('cors');
var bodyParser = require('body-parser');
var pythonShell = require('python-shell');
var finished_py = false;

app.use(bodyParser.json());

//enables cors
app.use(cors({
  'allowedHeaders': ['sessionId', 'Content-Type'],
  'exposedHeaders': ['sessionId'],
  'origin': '*',
  'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'preflightContinue': false
}));

app.post('/', function (req, res) {
	finished_py = false;
	var body = req.body;
	var showfile = "D:\\__AGISI\\Survey_DefiningIntelligence\\SemanticAnalysis_ProjectWithMelanieHackl\\doneByLaura\\Website\\Parameter\\show.txt"; //"E:\\Website\\Parameter\\show.txt";
	var docfile = "D:\\__AGISI\\Survey_DefiningIntelligence\\SemanticAnalysis_ProjectWithMelanieHackl\\doneByLaura\\Website\\Parameter\\documents.txt";//"E:\\Website\\Parameter\\documents.txt";
	var countfile = "D:\\__AGISI\\Survey_DefiningIntelligence\\SemanticAnalysis_ProjectWithMelanieHackl\\doneByLaura\\Website\\Parameter\\count.txt";//"E:\\Website\\Parameter\\count.txt";
	var wordsfile = "D:\\__AGISI\\Survey_DefiningIntelligence\\SemanticAnalysis_ProjectWithMelanieHackl\\doneByLaura\\Website\\Parameter\\words.txt";//"E:\\Website\\Parameter\\words.txt";
	
	//open parameter files for writing
	const sFile = fs.writeFile(showfile, body[0], { flag: 'w+' }, (err) => {
		if(err) { console.log(err); }
	});
	const dFile = fs.writeFile(docfile, "[" + body[1].join(", ") + "]", { flag: 'w+' }, (err) => {
		if(err) { console.log(err); }
	});
	const cFile = fs.writeFile(countfile, body[2], { flag: 'w+' }, (err) => {
		if(err) { console.log(err); }
	});
	const wFile = fs.writeFile(wordsfile, "[" + body[3].join(", ") + "]", { flag: 'w+' }, (err) => {
		if(err) { console.log(err); }
	});
	
	//open python shell to run preprocessing script
	pythonShell.PythonShell.run('preprocessing_website.py', null, function (err) {
		if (err) throw err;
		console.log('finished preprocessing script');
		finished_py = true;
	});
	res.send('true');
});

app.get('/', function (req, res) {
	//send variable to check if python script is already finished
	res.send(finished_py);
});

app.listen(3000, function () {
	console.log('VintDef listening on port 3000');
});

