var mp4Controllers = angular.module('mp4Controllers', []);

mp4Controllers.controller('UsersController', ['$scope', '$http', '$window', 'Users', 'Tasks', function($scope, $http, $window, Users, Tasks) {
    $scope.usersData = [];
    Users.get("?select={\"name\":1,\"email\":1}").success(function (data) {
        $scope.usersData = data.data;
    });
    $scope.deleteUser = function (userID) {
        Users.delete_user(userID, function () {
            var msg1 = "?where={\"assignedUser\":\"" + userID + "\", \"completed\":false}";
            //console.log("delete user: " + userID + "\n");
            Tasks.get(msg1).success(function (taskdata) {
                //$scope.tasksData = taskdata.data;
                var tasklist = taskdata.data;
                tasklist.forEach(function(task){
                    //console.log("task to delete: "+task.name + " " + task._id + " " + task.deadline + "\n");
                    var msg2 = {
                        "name": task.name,
                        "description": task.description,
                        "deadline": task.deadline,
                        "completed": false,
                        "assignedUser":"",
                        "assignedUserName": "unassigned",
                    };
                    Tasks.update(task._id, msg2, function(){
                        console.log("successfully removed user");
                    })
                });
            });
            Users.get("?select={\"name\":1,\"email\":1}").success(function (data) {
                $scope.usersData = data.data;
            })
        });
    }
}]);

mp4Controllers.controller('AddUserController', ['$scope', '$http', 'Users', '$window' , function($scope, $http, Users, $window) {
    $scope.user_name = '';
    $scope.user_email = '';
    $scope.added_user_name = '';
    $scope.empty_user = false;
    $scope.empty_email = false;
    $scope.addSuccess = false;
    $scope.duplicateEmail = false;

    $scope.addUserInfo = function () {
        $scope.duplicateEmail = false;
        if (($scope.user_email != '') && ($scope.user_name != '')) {
            $scope.empty_user = false;
            $scope.empty_email = false;
            var msg1 = "?where={\"email\":\""+ $scope.user_email + "\"}&count=true";
            //console.log("sdk: "+msg1 +"\n");
            Users.get(msg1).success(function (data) {
                var cnt = data.data;
                if (cnt > 0) {
                    $scope.duplicateEmail = true;
                    $scope.addSuccess = false;
                }
                else {
                    $scope.duplicateEmail = false;
                    var msg2 = {
                        "name": $scope.user_name,
                        "email": $scope.user_email
                    };
                    Users.post(msg2, function () {
                        $scope.added_user_name = $scope.user_name;
                        $scope.addSuccess = true;
                        $scope.user_name = '';
                        $scope.user_email = '';
                    });
                }
            });
        }
        else {
            if ($scope.user_email === '') {
                $scope.empty_email = true;
            }
            if ($scope.user_name === '') {
                $scope.empty_user = true;
            }
        }
    }
}]);

mp4Controllers.controller('UserInfoController', ['$scope', '$http', '$window', 'Users', 'Tasks', '$routeParams', function($scope, $http, $window, Users, Tasks, $routeParams) {
    //$scope.usersData = [];
    $scope.user = {};
    //$scope.tasksData = [];
    $scope.user_id = $routeParams.userID;
    $scope.pendingTasks = [];
    $scope.completedTasks = [];
    $scope.show = false;


    var msg1 = "?where={\"_id\":\"" + $scope.user_id + "\"}&select={\"name\":1, \"email\":1}";
    Users.get(msg1).success(function (data) {
        $scope.user = data.data[0];
    });
    var msg2 = "?where={\"assignedUser\":\"" + $scope.user_id + "\"}&select={\"name\":1,\"deadline\":1, \"completed\":1}";
    Tasks.get(msg2).success(function (taskdata) {
        taskdata.data.forEach(function(task) {
            if (task.completed == false) {
                $scope.pendingTasks.push(task);
            }
            else {
                $scope.completedTasks.push(task);
            }
        });
    });
    $scope.completeTask = function (taskID) {
        var msg3 = "?where={\"_id\":\"" + taskID + "\"}&select={\"name\":1,\"deadline\":1, \"completed\":1}";
        Tasks.get(msg3).success(function(data) {
            var task = data.data[0];
            var msgForTasks = {
                "completed": true,
                "name": task.name,
                "deadline": task.deadline,
                "assignedUser": $scope.user_id,
                "assignedUserName": $scope.user.name
            };

            Tasks.update(taskID, msgForTasks, function () {
                console.log("successfully updated task");
                var index = -1;
                for (var i in $scope.pendingTasks) {
                    if ($scope.pendingTasks[i]._id == taskID) {
                        index = i;
                        break;
                    }
                }
                //console.log("index= " + index);
                if (index > -1) {
                    var pdtsks = $scope.pendingTasks.slice();
                    pdtsks.splice(index, 1);
                    var msgForUsers = {
                        "name": $scope.user.name,
                        "email": $scope.user.email,
                        "pendingTasks": pdtsks
                    };
                    Users.update($scope.user_id, msgForUsers, function () {
                        console.log("successfully update user");
                        //console.log("new completed: "+ $scope.pendingTasks[index].name);
                        $scope.completedTasks.push($scope.pendingTasks[index]);
                        $scope.pendingTasks.splice(index, 1);
                    });
                }

            });

        });

    }

    $scope.showCompletedTasks = function () {
        $scope.show = true;
    }
}]);

mp4Controllers.controller('TasksController', ['$scope', '$http', '$window', 'Tasks', 'Users', function($scope, $http, $window, Tasks, Users) {
    $scope.sortingMethods = ['Name', 'Date Created', 'Deadline', 'Assigned User'];
    $scope.sortedBy = 'Name';
    $scope.tasksData = [];
    $scope.userData = [];

    $scope.isAscending = true;
    $scope.range = 'pending';  //pending, completed, all
    $scope.display = 0;

    $scope.next = function () {
        if (($scope.display + 10) < $scope.tasksData.length) {
            $scope.display += 10;
        }
    }
    $scope.prev = function () {
        if ($scope.display >= 10) {
            $scope.display -= 10;
        }
    }
    var msg1 = "?where={\"completed\":false}&sort={\"name\":1}&select={\"name\":1, \"assignedUserName\":1}";
    Tasks.get(msg1).success(function (data) {
        $scope.tasksData = data.data;
    });

    function getMsg(){
        var where = "?";
        if ($scope.range == 'pending') {
            where += "where={\"completed\":false}&";
        }
        else if ($scope.range == 'completed') {
            where += "where={\"completed\":true}&";
        }
        var sort = "";
        if ($scope.sortedBy == $scope.sortingMethods[0]) {
            sort = "sort={\"name\":";
        }
        else if ($scope.sortedBy == $scope.sortingMethods[1]) {
            sort = "sort={\"dateCreated\":";
        }
        else if ($scope.sortedBy == $scope.sortingMethods[2]) {
            sort = "sort={\"deadline\":";
        }
        else if ($scope.sortedBy == $scope.sortingMethods[3]) {
            sort = "sort={\"assignedUserName\":";
        }
        var order = $scope.isAscending?"1}":"-1}";
        sort += order;
        var select = "&select={\"name\":1, \"assignedUserName\":1}";
        //console.log("msg = " + where+sort+select+'\n');
        return where + sort + select;

    }

    $scope.refresh = function() {
        var msg = getMsg();
        Tasks.get(msg).success(function (data) {
            $scope.tasksData = data.data;
            $scope.display = 0;
        });
    };

    $scope.deleteTask = function (taskID) {
        var msg2 = "?where={\"_id\":\"" + taskID  + "\"}"
        Tasks.get(msg2).success(function(data) {
            var taskdata = data.data[0];
            Tasks.delete_task(taskID, function() {
                if (taskdata.assignedUserName != "unassigned" && taskdata.completed == false) {
                    var msg3 = "?where={\"_id\":\"" + taskdata.assignedUser + "\"}";
                    Users.get(msg3).success(function (data) {
                        var userdata = data.data[0];
                        var pendingtsks = userdata.pendingTasks;
                        var index = pendingtsks.indexOf(taskID);
                        if (index > -1) {
                            pendingtsks.splice(index, 1);
                            var req = {
                                "name": userdata.name,
                                "email": userdata.email,
                                "pendingTasks": pendingtsks,
                            }
                            Users.update(taskdata.assignedUser, req, function () {
                                console.log("task delete succeed");
                            })
                        }
                    })
                }
                $scope.refresh();
            });
        });
    }
}]);

mp4Controllers.controller('AddTaskController', ['$scope', '$http', '$window', 'Tasks', 'Users', function($scope, $http, $window, Tasks, Users) {
    $scope.task_description = '';
    $scope.task_name = '';
    $scope.assigned_user = {};
    $scope.assigned_user_name = '';
    $scope.task_deadline = '';
    $scope.empty_task = false;
    $scope.empty_deadline = false;
    $scope.addTaskSuccess = false;

    Users.get("?select={\"name\":1}").success(function (data) {
        $scope.users = data.data;
    });
    $scope.addTaskInfo = function () {
        $scope.addTaskSuccess = false;

        if ($scope.task_name != '' && $scope.task_deadline != '') {
            $scope.empty_task = false;
            $scope.empty_deadline = false;

            var msg = {
                "name": $scope.task_name,
                "description": $scope.task_description,
                "assignedUserName": $scope.assigned_user.name,
                "assignedUser": $scope.assigned_user._id,
                "deadline": $scope.task_deadline
            };
            Tasks.post(msg, function (data) {
                var taskdata = data.data;
                $scope.empty_task = false;
                $scope.empty_deadline = false;
                $scope.addTaskSuccess = true;
                $scope.task_description = '';
                $scope.task_name = '';
                $scope.assigned_user_name = '';
                $scope.task_deadline = '';
                //console.log("assigned user: " + taskdata.assignedUser + "\n")

                if (taskdata.assignedUserName != "unassigned") {
                    var msg1 = "?where={\"_id\":\"" + taskdata.assignedUser + "\"}"
                    //console.log("show msg1: " + msg1 + "\n");
                    Users.get(msg1).success(function(data){
                        var tasks = data.data[0].pendingTasks;
                        tasks.push(taskdata._id);
                        //console.log(taskdata._id);
                        var msg2 = {
                            "name": data.data[0].name,
                            "email": data.data[0].email,
                            "pendingTasks": tasks,
                        };
                        Users.update(taskdata.assignedUser, msg2, function(){
                            console.log("update user succeed");
                        });
                    })
                }
                console.log("created task succeed");
            });
        }
        else {
            if ($scope.task_name === '') {
                $scope.empty_task = true;
            }
            if ($scope.task_deadline == '') {
                $scope.empty_deadline = true;
            }
            $scope.addTaskSuccess = false;
        }
    }
}]);


mp4Controllers.controller('TaskInfoController', ['$scope', '$http', '$window', 'Tasks', '$routeParams', function($scope, $http, $window, Tasks, $routeParams) {
    $scope.task_id = $routeParams.taskID;
    $scope.task = {};

    var msg1 = "?where={\"_id\":\"" + $scope.task_id +  "\"}";
    Tasks.get(msg1).success(function(data) {
        $scope.task = data.data[0];
    });
}]);

mp4Controllers.controller('EditTaskController', ['$scope', '$http', '$window', 'Users', 'Tasks', '$routeParams', function($scope, $http, $window, Users, Tasks, $routeParams) {
    $scope.task_id = $routeParams.taskID;
    //$scope.tasksData = [];
    $scope.task = {};
    $scope.empty_task = false;
    $scope.empty_deadline = false;
    $scope.assigned_user = {};

    $scope.completed;
    $scope.editTaskSuccess = false;
    var oldUser = {};
    var newUser = {};

    var msg1 = "?where={\"_id\":\"" + $scope.task_id + "\"}";
    Tasks.get(msg1).success(function (data) {
        $scope.task = data.data[0];
        $scope.task_name = $scope.task.name;
        $scope.task_deadline = $scope.task.deadline;
        $scope.task_description = $scope.task.description;
        $scope.completed = $scope.task.completed;

        Users.get("?select={\"name\":1}").success(function (data) {
            $scope.users = data.data;
            $scope.userOpts = [$scope.assigned_user];
            if ($scope.task.assignedUserName != 'unassigned') {
                for (var i in $scope.users) {
                    $scope.userOpts.push($scope.users[i]);
                    if ($scope.users[i]._id == $scope.task.assignedUser) {
                        $scope.assigned_user = $scope.users[i];
                    }
                }
            }
            else {
                for (var i in $scope.users) {
                    $scope.userOpts.push($scope.users[i]);
                }
                $scope.assigned_user = $scope.userOpts[0];
            }
            oldUser = $scope.assigned_user;
        });
    });

    $scope.editTaskInfo = function () {
        $scope.editTaskSuccess = false;

        if (($scope.task_name != '') && ($scope.task_deadline != '')) {
            $scope.empty_task = false;
            $scope.empty_deadline = false;
            if (Object.keys(oldUser).length == 0 && Object.keys($scope.assigned_user).length == 0) {
                console.log("the job neither was nor is assigned.");
                msg4task = {
                    "name": $scope.task_name,
                    "description": $scope.task_description,
                    "deadline": $scope.task_deadline,
                    "completed": $scope.completed,
                    "assignedUser": "",
                    "assignedUserName": "unassigned"
                };
                Tasks.update($scope.task_id, msg4task, function () {
                    $scope.editTaskSuccess = true;
                });
            }
            else if (Object.keys(oldUser).length == 0) {
                console.log("the job was not assigned but is now assigned.");
                newUser = $scope.assigned_user;
                var msg4task = {
                    "name": $scope.task_name,
                    "description": $scope.task_description,
                    "deadline": $scope.task_deadline,
                    "assignedUser": newUser._id,
                    "assignedUserName": newUser.name,
                    "completed": $scope.completed
                };
                Tasks.update($scope.task_id, msg4task, function () {
                    if ($scope.completed == true) {
                        oldUser = newUser;
                        newUser = {};
                        $scope.editTaskSuccess = true;
                    }
                    else {
                        var msg2 = "?where={\"_id\":\"" + newUser._id + "\"}";
                        Users.get(msg2).success(function(data){
                            var userdata = data.data[0];
                            var newtasks = userdata.pendingTasks;
                            newtasks.push($scope.task_id);
                            var msg4NewUser = {
                                "name": userdata.name,
                                "email": userdata.email,
                                "pendingTasks": newtasks
                            };
                            Users.update(userdata._id, msg4NewUser, function () {
                                oldUser = newUser;
                                newUser = {};
                                $scope.editTaskSuccess = true;
                            });
                        });
                    }
                });
            }
            else if (Object.keys($scope.assigned_user).length == 0) {
                console.log("the job was assigned, but now unassigned.");
                newUser = {};
                var msg4task = {
                    "name": $scope.task_name,
                    "description": $scope.task_description,
                    "deadline": $scope.task_deadline,
                    "assignedUser": "",
                    "assignedUserName": "unassigned",
                    "completed": $scope.completed
                };
                Tasks.update($scope.task_id, msg4task, function () {

                    var msg2 = "?where={\"_id\":\"" + oldUser._id + "\"}";
                    Users.get(msg2).success(function(data) {
                        var userdata = data.data[0];
                        var index = userdata.pendingTasks.indexOf($scope.task_id);
                        if (index > -1) {
                            var tasks = userdata.pendingTasks;
                            tasks.splice(index, 1);
                            //oldUser.pendingTasks.splice(index, 1);
                            var msg4OldUser = {
                                "name": userdata.name,
                                "email": userdata.email,
                                "pendingTasks": tasks
                            };
                            Users.update(oldUser._id, msg4OldUser, function () {
                                oldUser = $scope.assigned_user;
                            });
                        }
                        else {
                            oldUser = $scope.assigned_user;
                        }
                    });
                    $scope.editTaskSuccess = true;

                });

            }
            else {
                console.log("the job was, is assigned.");
                newUser = $scope.assigned_user;
                var msg4task = {
                    "name": $scope.task_name,
                    "description": $scope.task_description,
                    "deadline": $scope.task_deadline,
                    "completed": $scope.completed,
                    "assignedUser": newUser._id,
                    "assignedUserName": newUser.name,
                };
                //if (!$scope.completed) console.log("now is pending");
                //else console.log("now is completed");
                Tasks.update($scope.task_id, msg4task, function () {
                    //console.log("update succeed");
                    if (oldUser._id == newUser._id) {
                        var msg2 = "?where={\"_id\":\"" + oldUser._id + "\"}";
                        Users.get(msg2).success(function(data) {
                            var userdata = data.data[0];
                            var index = userdata.pendingTasks.indexOf($scope.task_id);
                            if (index > -1) {
                                if ($scope.completed == true) {
                                    userdata.pendingTasks.splice(index, 1);
                                    //tasks.splice(index, 1);
                                    //oldUser.pendingTasks.splice(index, 1);
                                    var msg4OldUser = {
                                        "name": userdata.name,
                                        "email": userdata.email,
                                        "pendingTasks": userdata.pendingTasks
                                    };
                                    Users.update(oldUser._id, msg4OldUser, function () {
                                        //console.log("pending task removed");
                                    });
                                }
                                oldUser = $scope.assigned_user;
                                $scope.editTaskSuccess = true;
                            }
                            else {
                                if ($scope.completed == false) {
                                    userdata.pendingTasks.push($scope.task_id);
                                    var msg4OldUser2 = {
                                        "name": userdata.name,
                                        "email": userdata.email,
                                        "pendingTasks": userdata.pendingTasks
                                    }
                                    Users.update(oldUser._id, msg4OldUser2, function () {
                                        //console.log("pending task added");
                                    });
                                }
                                oldUser = $scope.assigned_user;
                                $scope.editTaskSuccess = true;
                            }
                        });
                    }
                    else {
                        var msg3 = "?where={\"_id\":\"" + oldUser._id + "\"}";
                        Users.get(msg3).success(function(data) {
                            var userdata = data.data[0];
                            var index = userdata.pendingTasks.indexOf($scope.task_id);
                            if (index > -1) {
                                userdata.pendingTasks.splice(index, 1);
                                //oldUser.pendingTasks.splice(index, 1);
                                var msg4OldUser = {
                                    "name": userdata.name,
                                    "email": userdata.email,
                                    "pendingTasks": userdata.pendingTasks
                                };
                                Users.update(oldUser._id, msg4OldUser, function () {
                                    oldUser = $scope.assigned_user;
                                });
                            }
                            else {
                                oldUser = $scope.assigned_user;
                            }
                        });

                        if ($scope.completed == false) {
                            var msg4 = "?where={\"_id\":\"" + newUser._id + "\"}";
                            Users.get(msg4).success(function(data) {
                                var udata = data.data[0];
                                var tlist = udata.pendingTasks;
                                tlist.push($scope.task_id);
                                var msg4NewUser = {
                                    "name": udata.name,
                                    "email": udata.email,
                                    "pendingTasks": tlist
                                }
                                Users.update(newUser._id, msg4NewUser, function () {
                                    //newUser = $scope.assigned_user;
                                });
                            });
                        }
                        $scope.editTaskSuccess = true;
                    }
                });
            }
        }
        else {
            if ($scope.task_name == '') {
                $scope.empty_task = true;
                $scope.editTaskSuccess = false;
            }
            if ($scope.task_deadline == '') {
                $scope.empty_deadline = true;
                $scope.editTaskSuccess = false;
            }
        }
    }
}]);

mp4Controllers.controller('SettingsController', ['$scope' , '$window' , function($scope, $window) {
    $scope.url = $window.sessionStorage.baseurl;
    $scope.isSet = false;
    $scope.isInvalid = false;
    $scope.setUrl = function () {
        $scope.isSet = false;
        $scope.isInvalid = false;
        $window.sessionStorage.baseurl = $scope.url;
        $scope.displayText = "URL set";
        if ($scope.url.endsWith('/')) {
            $scope.isInvalid = true;
            $scope.isSet = false;
        }
        else {
            $scope.isInvalid = false;
            $scope.isSet = true;
        }
    };

}]);
