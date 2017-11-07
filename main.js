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
    if (lo.findIndex(ladder.players, ['name', name]) < 0) {
        ladder.players.push({ 'name': name, 'position': ladder.players.length + 1});
        io.emit('notice', { message : 'New payer added: ' + name, priority : 'success' });
    } else if (!name || name.length === 0) {
        socket.emit('notice', { message : 'Can\'t add player without name', priority : 'danger' });
    } else
        socket.emit('notice', { message : 'Can\'t add player "' + name + '": already exists', priority : 'danger' });
    
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
    var sortedScore = lo.sortBy(result, 'score');
    
    var winner = ladder.players[lo.findIndex(ladder.players, ['name', sortedScore[1].name])];
    var loser  = ladder.players[lo.findIndex(ladder.players, ['name', sortedScore[0].name])];
    
    if (Math.abs(winner.position - loser.position) > ladder.challengeSpan)
        return socket.emit('notice', { message : 'Couldn\'t add result as it is outside challenge span of ' + ladder.challengeSpan, priority : 'danger' });
    
    ladder.matches.push({ 
        winner: sortedScore[1].name,
        winnerScore: sortedScore[1].score,
        loser: sortedScore[0].name,
        loserScore: sortedScore[0].score,
        time: Date.now()
    });
    
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
        console.log('Socket connection');

        socket.emit('ladder update', ladder);

        socket.on('get ladder', function() {
            console.log('Ladder requested');
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