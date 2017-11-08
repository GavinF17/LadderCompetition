(function() {
    'use strict';
    
    angular.module('ladder', ['ngRoute'])
        .controller('LadderController', ['$scope', '$rootScope', '$http', LadderController]);

    function LadderController($scope, $rootScope, $http) {
        //$rootScope.socket = io('http://'+window.location.hostname+':'+window.location.port);
        $rootScope.socket = io();
        
        $rootScope.socket.emit('get ladder');
        
        $rootScope.socket.on('ladder update', function(ladder) {
            $scope.ladder = ladder;
            $scope.$apply();
        });
        
        toastr.options.timeOut = 2500;
        $rootScope.socket.on('notice', function(info) {
            console.log(info);
            toastr[info.priority](info.message);
        });
        
        $scope.niceDate = function(date) {
            date = new Date(date);
            
            var dateString = date.toLocaleDateString('en-GB');
            var hours = date.getHours(); if (hours < 10) hours = '0' + hours;
            var mins = date.getMinutes(); if (mins < 10) mins = '0' + mins;
            
            return dateString + ' ' + hours + ':' + mins;
        };
        
        $scope.getLastGame = function(name) {
            
        };
        
        $scope.getWinLoss = function(name, result) {
            if (result.winner === name)
                return 'W';
            else 
                return 'L';
        };
        
        $scope.getFormHover = function(result) {
            return result.winner + ' ' + result.winnerScore + '-' + result.loserScore + ' ' + result.loser;
        };
        
        $scope.lastPlayed = function(last5) {
            if (!last5 || last5.length === 0)
                return '';
            return $scope.niceDate(last5[last5.length-1].time);
        };
    }
})();