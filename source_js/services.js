var mp4Services = angular.module('mp4Services', []);

mp4Services.factory('Users', function($http, $window) {
    return {
        get: function(msg) {
            var baseUrl = $window.sessionStorage.baseurl;
            return $http.get(baseUrl+'/api/users' + msg);
        },
        post: function(msg, callback) {
            var baseUrl = $window.sessionStorage.baseurl;
            $http.post(baseUrl+'/api/users', msg).success(function(){
                callback();
            });
        },
        update: function(userID, msg, callback){
            var baseUrl = $window.sessionStorage.baseurl;
            $http.put(baseUrl+'/api/users'+'/'+userID, msg).success(function(){
                callback();
            });
        },
        //update: function(userID, msg, callback){
        //    var baseUrl = $window.sessionStorage.baseurl;
        //    $http.put(baseUrl+'/api/users'+'/'+userID, msg).success(function(){
        //        callback();
        //    });
        //},
        delete_user: function(userID, callback){
            var baseUrl = $window.sessionStorage.baseurl;
            $http.delete(baseUrl+'/api/users'+'/'+userID).success(function(){
                callback();
            });
        }
    }
});

mp4Services.factory('Tasks', function($http, $window) {
    return {
        get: function(msg) {
            var baseUrl = $window.sessionStorage.baseurl;
            return $http.get(baseUrl+'/api/tasks' + msg);
        },
        post: function(msg, callback) {
            var baseUrl = $window.sessionStorage.baseurl;
            $http.post(baseUrl+'/api/tasks', msg).success(function(data){
                callback(data);
            });
        },
        update: function(taskID, msg, callback){
            var baseUrl = $window.sessionStorage.baseurl;
            $http.put(baseUrl+'/api/tasks'+'/'+taskID, msg).success(function(){
                callback();
            });
        },
        delete_task: function(taskID, callback){
            var baseUrl = $window.sessionStorage.baseurl;
            $http.delete(baseUrl+'/api/tasks'+'/'+taskID).success(function(){
                callback();
            });
        }
    }
});