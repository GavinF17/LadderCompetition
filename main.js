// Server requirements:
var finalhandler = require('finalhandler');
var http = require('http');
var serveStatic = require('serve-static');
var port = process.env.PORT || 1253;
// Internal requirements:
const lo = require('lodash');
const fs = require('fs');

// Logging:
const winston       = require('winston');
winston.add(winston.transports.File, { 
    filename: './log.log',
    handleExceptions: true,
    humanReadableUnhandledException: true
});

// Serve up public/ftp folder@
var serve = serveStatic('frontend', {'index': ['index.html']});

// Create server
var app = http.createServer(function onRequest (req, res) {
  serve(req, res, finalhandler(req, res));
});

// Socket.io server listens to our app
var io = require('socket.io').listen(app);

// Ladder loading/generation:
var ladder;
function getLadder(callback) {
    try {
        ladder = JSON.parse(fs.readFileSync('./ladder.json', 'utf8'));
        winston.log('info', 'Ladder was loaded from file.');
    } catch (e) {
        ladder = { challengeSpan: 2, players: [], matches: [] };
        winston.log('info', 'Ladder was not found, new one created.');
    }
    callback();
}

function start() {
    getLadder(startSocketio);
}
start();

function addPlayer(name, socket) {
    var validationErrors = validateAddPlayer(name);
    if (validationErrors !== '') {
        winston.log('error', 'Error adding player: ' + validationErrors, name);
        return socket.emit('notice', { message : validationErrors, priority : 'danger' });
    }

    ladder.players.push({ 'name': name, 'position': ladder.players.length + 1, last5: [] });
    io.emit('notice', { message : 'New payer added: ' + name, priority : 'success' });
    saveData();
}

function removePlayer(name, socket) {
    var index = lo.findIndex(ladder.players, ['name', name]);
    
    if (index >= 0) {
        var position = ladder.players[index].position;

        ladder.players.splice(index, 1);

        ladder.players.forEach(function(player) {
            if (player.position > position)
                player.position--;
        });
    } else
        socket.emit('notice', { message : 'Can\'t remove player "' + name + '": doesn\'t exist', priority : 'danger' });
    
    
    saveData();
}

// [{ 'name': 'player1', 'score': 10 }, { 'name': 'player2', 'score': 1 }]
function addMatch(result, socket) {
    var validationErrors = validateAddMatch(result);
    if (validationErrors !== '') {
        winston.log('error', 'Error adding match: ' + validationErrors, result);
        return socket.emit('notice', { message : validationErrors, priority : 'danger' });
    }
    
    var sortedScore = lo.sortBy(result, 'score');
    
    var winner = ladder.players[lo.findIndex(ladder.players, ['name', sortedScore[1].name])];
    var loser  = ladder.players[lo.findIndex(ladder.players, ['name', sortedScore[0].name])];
    
    var matchResult = { 
        winner: sortedScore[1].name,
        winnerScore: sortedScore[1].score,
        loser: sortedScore[0].name,
        loserScore: sortedScore[0].score,
        time: Date.now()
    };
    
    ladder.matches.push(matchResult);
    updateForm(matchResult, winner);
    updateForm(matchResult, loser);
    
    if (winner.position < loser.position) {
        io.emit('notice', { message : winner.name + ' remains above ' + loser.name, priority : 'success' });
    } else {
        if (Math.abs(winner.position - loser.position) === 1) {
            winner.position--;
            loser.position++;
            io.emit('notice', { message : winner.name + ' goes above ' + loser.name, priority : 'success' });
        } else {
            var middlePlayer = ladder.players[lo.findIndex(ladder.players, ['position', winner.position - 1])];
            middlePlayer.position++;
            loser.position++;
            winner.position = winner.position - 2;
            io.emit('notice', { message : winner.name + ' goes above ' + loser.name + ' and ' + middlePlayer.name, priority : 'success' });
        }
    }
    
    saveData();
}

function updateForm(result, player) {
    if (!player.last5)
        player['last5'] = [];
    else if (player.last5.length >= 5)
        player.last5.splice(0,1);
    
    player.last5.push(result);
}

function saveData() {
    fs.writeFile("./ladder.json", JSON.stringify(ladder), function(err) {
        if(err)
            return io.emit('notice', { message : 'Error saving data file on server: ' + err, priority : 'danger' });
        else
            console.log("Ladder data was saved!");
    }); 
}

function startSocketio() {
    io.on('connection', function (socket) {
        winston.log('info', 'Socket connection from ' + socket.handshake.address);

        socket.emit('ladder update', ladder);

        socket.on('get ladder', function() {
            winston.log('info', 'Ladder requested by ' + socket.handshake.address);
            socket.emit('ladder update', ladder);
        });

        socket.on('add player', function(name) {
            winston.log('info', 'Player added by ' + socket.handshake.address, name);
            addPlayer(name, socket);
            io.emit('ladder update', ladder);
        });

        socket.on('add match', function(result) {
            winston.log('info', 'Match added by ' + socket.handshake.address, JSON.stringify(result));
            addMatch(result, socket);
            io.emit('ladder update', ladder);
        });
    });
}

// Listen
app.listen(port);

function validateAddPlayer(name) {
    var errors = '';
    // Check type
    if (typeof name !== 'string')
        errors += 'Name of player to add must be a string.\n';
    // Check length
    else if (name.length === 0)
        errors += 'Name must not be blank.\n';
    else if (name.length > 15)
        errors += 'Name must not be larger than 15 characters.\n';
    // Ensure doesn't exist
    else if (lo.findIndex(ladder.players, ['name', name]) !== -1)
        errors += 'Can\'t add player "' + name + '": already exists';
    
    return errors;
}

function validateAddMatch(results) {
    var errors = '';
    
    // Check required fields exist and are of the correct type:
    if (!results || typeof results !== 'object'|| results.length !== 2 || !results[0].name || results[0].score === undefined || !results[1].name || results[1].score === undefined || 
            typeof results[0].name !== 'string' || typeof results[1].name !== 'string' || 
            !Number.isInteger(parseInt(results[0].score)) || !Number.isInteger(parseInt(results[1].score)) ||
            results[0].score < 0 || results[0].score > 10 || results[1].score < 0 || results[1].score > 10)
        errors += 'Results must be a JSON array of the format: [{ name: STRING, score: INTEGER(0 to 10) }, { name: STRING, score: INTEGER(0 to 10) }]';
    else if (results[0].name === results[1].name)
        errors += 'The names provided cannot be the same ' + results[1].name;
    else if (lo.findIndex(ladder.players, ['name', results[0].name]) === -1 || lo.findIndex(ladder.players, ['name', results[1].name]) === -1)
        errors += 'One or both names provided couldn\'t be found in the ladder.';
    else if (Math.abs(ladder.players[lo.findIndex(ladder.players, ['name', results[1].name])].position - 
            ladder.players[lo.findIndex(ladder.players, ['name', results[0].name])].position) > ladder.challengeSpan)
        errors += 'Couldn\'t add result as it is outside challenge span of ' + ladder.challengeSpan;
    else if (results[0].score !== 10 && results[1].score !== 10)
        errors += 'One of the scores must be 10';
    else if (results[0].score === 10 && results[1].score === 10)
        errors += 'One of the scores must be less than 10';
    
    return errors;
}