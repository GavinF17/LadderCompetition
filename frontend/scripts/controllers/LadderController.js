(function() {
    'use strict';
    
    angular.module('ladder', ['ngRoute'])
        .controller('LadderController', ['$scope', '$rootScope', '$http', LadderController]);

    function LadderController($scope, $rootScope, $http) {
        $rootScope.socket = io('http://'+window.location.hostname+':'+window.location.port);
        
        $rootScope.socket.emit('get ladder');
        
        $rootScope.socket.on('ladder update', function(ladder) {
            $scope.ladder = ladder;
            $scope.$apply();
        });
        
        $rootScope.socket.on('notice', function(info) {
            console.log(info);
            $.toaster(info);
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
        
        $scope.getForm = function(name) {
            
        };
        
        $scope.getForm = function(name) {
            // Should get the last 5 matches
            return 'TODO! ' + name[0];
        };
    }
})();