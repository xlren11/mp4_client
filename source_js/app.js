var app = angular.module('mp4', ['720kb.datepicker','ngRoute', 'mp4Controllers', 'mp4Services']);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/tasks', {
    templateUrl: 'partials/tasks.html',
    controller: 'TasksController'
  }).when('/users', {
    templateUrl: 'partials/users.html',
    controller: 'UsersController'
  }).when('/addUser', {
    templateUrl: 'partials/addUser.html',
    controller: 'AddUserController'
  }).when('/addTask', {
    templateUrl: 'partials/addTask.html',
    controller: 'AddTaskController'
  }).when('/users/:userID', {
    templateUrl: 'partials/userInfo.html',
    controller: 'UserInfoController'
  }).when('/tasks/:taskID', {
    templateUrl: 'partials/taskInfo.html',
    controller: 'TaskInfoController'
  }).when('/tasks/:taskID/edit', {
    templateUrl: 'partials/editTask.html',
    controller: 'EditTaskController'
  }).when('/settings', {
    templateUrl: 'partials/settings.html',
    controller: 'SettingsController'
  }).otherwise({
    redirectTo: '/settings'
  });
}]);
