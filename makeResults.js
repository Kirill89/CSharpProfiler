var fs = require('fs');

function parseLog(name) {
	var result = [];

	var classNamePrefix = 'Class:';
	var methodNamePrefix = 'Method:';
	var timeNamePrefix = ' time:';
	var file = fs.readFileSync(name).toString();
	var lineExp = new RegExp('^!>>>(.*)<<<!$', 'mg');
	var methodExp = new RegExp(methodNamePrefix + '(.*),', 'g');
	var classNameExp = new RegExp(classNamePrefix + '(.*), M', 'g');
	var timeExp = new RegExp(timeNamePrefix + '(.*)]', 'g');
	var matches = file.match(lineExp);
	matches.forEach(function(line) {
		var method = line.match(methodExp)[0].replace(methodNamePrefix + '[', '').replace(']', '').replace(',', '');
		var className = line.match(classNameExp)[0].replace(classNamePrefix + '[', '').replace(']', '').replace(', M', '');
		var time = line.match(timeExp)[0].replace(timeNamePrefix + '[', '').replace(']', '').replace(',', '');

		result.push({'className':className, 'methodName':method, 'time':time});
	});

	return result;
}

var result = parseLog('log.txt');
result.sort(function(a, b) {
	return (a.time - b.time);
});

var results = [];

result.forEach(function(object) {
	var key = object.className + '::' + object.methodName;
	if(results[key] == undefined)
		results[key] = {'calls':0, 'time':0, 'avg':0, 'name':key};
	results[key].time += parseInt(object.time);
	results[key].calls += 1;
	results[key].avg = results[key].time > 0 ? Math.round(results[key].time / results[key].calls) : 0;
});

var resultsTmp = [];
for (var key in results) {
	var r = results[key];
	resultsTmp.push(r);
}
results = resultsTmp;

results.sort(function(a, b) {
	return (a.avg - b.avg);
});

var toWrite = 'name;calls;avg;total\n';

results.forEach(function(r) {
	toWrite = toWrite + r.name + ';' + r.calls + ';' + r.avg + ';' + r.time + '\n';
});

//console.log(toWrite);
fs.writeFileSync('logout.csv', toWrite);