var fs = require('fs');

String.prototype.insert = function (index, string) {
    if(index > 0)
        return this.substring(0, index) + string + this.substring(index, this.length);
    else
        return string + this;
};

function getIndicesOf(searchStr, str, caseSensitive) {
    var startIndex = 0, searchStrLen = searchStr.length;
    var index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

String.prototype.indicesOf = function (searchStr, start, end) {
    var startIndex = start, searchStrLen = searchStr.length;
    var index, indices = [];
    while ((index = this.indexOf(searchStr, startIndex)) > -1) {
        if(index >= end)
            return indices;
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

function processFile(name) {

    var file = fs.readFileSync(name).toString();
    var figureBracketLefel = 0;
    var roundedBracketPos = 0;
    var functionEnter = false;
    var length = file.length;
    var startFunctionsInsert = [];
    var endFunctionsInsert = [];
    var arrowPos = 0;

    var commentsStart = false;

    for(var i = 0; i < length; i++) {
        if((file[i] == '*') && ((1 + i) <= length) && (file[1 + i] == '/')) {
            commentsStart = false;
        }

        if((file[i] == '/') && ((1 + i) <= length) && (file[1 + i] == '*')) {
            commentsStart = true;
        }

        if(!commentsStart) {
            if(file[i] == ')') {
                roundedBracketPos = i;
            }

            if((file[i] == '=') && ((1 + i) <= length) && (file[1 + i] == '>')) {
                arrowPos = i;
            }

            if(file[i] == '{') {
                figureBracketLefel++;
                if((Math.abs(roundedBracketPos - i) < 10) && (figureBracketLefel == 3) && (Math.abs(arrowPos - i) > 3)) {
                    functionEnter = true;
                    startFunctionsInsert.push(i);
                }
            }

            if(file[i] == '}') {
                figureBracketLefel--;
                if(functionEnter && figureBracketLefel == 2) {
                    functionEnter = false;
                    endFunctionsInsert.push(i);
                }
            }
        }
    }

    var insertEnd = '__sw__.Stop();System.Console.WriteLine("!>>> Class:[{0}], Method:[{1}], Execution time:[{2}] <<<!", __className__, __methodName__, __sw__.ElapsedMilliseconds);';
    var insertStart = 'var __method__ = System.Reflection.MethodBase.GetCurrentMethod();string __className__ = __method__.DeclaringType.Name;string __methodName__ = __method__.Name;System.Diagnostics.Stopwatch __sw__ = new System.Diagnostics.Stopwatch();__sw__.Start();';
    //var insertStart = '/*<+++>*/';
    //var insertEnd = '/*<--->*/';

    var insertsCount = startFunctionsInsert.length;

    while(insertsCount != 0) {
        var startIndex = 0;
        var endIndex = 0;
        startIndex = startFunctionsInsert.pop();
        endIndex = endFunctionsInsert.pop();
        
        file = file.insert(endIndex, insertEnd);

        var indexes = file.indicesOf('return', startIndex, endIndex);
        indexes.sort(function(a, b) { return b - a; });
        indexes.forEach(function(i) {
            file = file.insert(i, '{' + insertEnd);

            var ind = file.indexOf(';', i + insertEnd.length + 1);
            /*while(file.indexOf(';', ind - 7) == -1 || file.indexOf(';', ind - 7) > ind) {
                ind = file.indexOf('\n', ind + 1);
            }*/

            file = file.insert(ind + 1, '}');
        });

        file = file.insert(1 + startIndex, insertStart);

        insertsCount--;
    }

    return file;
}

function walk(dir, done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
        if (err)
            return done(err);
        var pending = list.length;
        if (!pending)
            return done(null, results);
        list.forEach(function(file) {
            file = dir + '/' + file;
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                    results = results.concat(res);
                    if (!--pending)
                        done(null, results);
                    });
                } else {
                    results.push(file);
                    if (!--pending)
                        done(null, results);
                }
            });
        });
    });
}

//var file = processFile('KeeperActivity.cs');
//console.log(file);

walk('/Users/kirill/Projects/CoinKeeper/Client/Android/Classes/', function(val, results) {
    results.forEach(function(filePath) {
        if(filePath.substring(filePath.length - 3) == '.cs') {
            fs.writeFileSync(filePath, processFile(filePath));
            console.log(filePath);
        }
    });
});
