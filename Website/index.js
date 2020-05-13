var express = require('express');
var app = express();
const fs = require('fs');
var cors = require('cors');
var bodyParser = require('body-parser');
var pythonShell = require('python-shell');
var finished_py = false;

app.use(bodyParser.json());

//enable cors
app.use(cors({
    'allowedHeaders': ['sessionId', 'Content-Type'],
    'exposedHeaders': ['sessionId'],
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
}));

app.post('/', function(req, res) {
    finished_py = false;
    var body = req.body;

    //change links to parameter docs
    /*
    var showfile = "..\\Website\\Parameter\\show.txt";
    var docfile = "..\\Website\\Parameter\\documents.txt";
    var countfile = "..\\Website\\Parameter\\count.txt";
    var wordsfile = "..\\Website\\Parameter\\words.txt";
    var chartfile = "..\\Website\\Parameter\\chart.txt";
    console.log(body)
    //open parameter files for writing
    const sFile = fs.writeFile(showfile, body[0], { flag: 'w+' }, (err) => {
        if (err) { console.log(err); }
    });
    const chFile = fs.writeFile(chartfile, body[1], { flag: 'w+' }, (err) => {
        if (err) { console.log(err); }
    });
    const dFile = fs.writeFile(docfile, body[2].join(","), { flag: 'w+' }, (err) => {
        if (err) { console.log(err); }
    });
    const cFile = fs.writeFile(countfile, body[3], { flag: 'w+' }, (err) => {
        if (err) { console.log(err); }
    });
    const wFile = fs.writeFile(wordsfile, "[" + body[4].join(", ") + "]", { flag: 'w+' }, (err) => {
        if (err) { console.log(err); }
    });*/


    //open python shell to run preprocessing script
    //change link to preprocessing script
    //console.log(body);
    pythonShell.PythonShell.run('..\\Website\\preprocessing_website.py', { args: body }, function(err) {
        if (err) throw err;
        console.log('finished preprocessing script');
        finished_py = true;
    });

    res.send('true');
});
app.get('/test', function(req, res) {
    var test;
    test = fs.readFileSync("..\\Website\\table.html", 'utf8');
    res.send(test);
});

app.get('/', function(req, res) {
    //send variable to check if python script is already finished
    if (finished_py) {
        var jsonString;
        jsonString = fs.readFileSync("..\\Website\\current.json", 'utf8');
        res.send(jsonString);
    } else {
        res.send(finished_py);
    }
});
app.listen(3000, function() {
    console.log('VintDef listening on port 3000');
});