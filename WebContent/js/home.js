var Chatbucket=angular.module("Chatbucket",['ngRoute','ngCookies']);
Chatbucket.config(function($routeProvider){
	$routeProvider
					
	/*.when('/', 
			{ 
		templateUrl:"index.html"
	    })*/
	.when("/login",		
			{	
		templateUrl:"views/login.html",
		controller:"loginController"
			
			})
			.when("/index",
	{
		templateUrl:"index.html",
		controller:'mainController'
	})
			
	.when("/userHome",
					
			{
				
		templateUrl:"views/userHome.html",
		controller:"userHomeController"
			
			})
			
	.when("/logout",
			{
		templateUrl:"views/logout.html",
		controller:"logoutController"
		
	})
	.when("/userjobs",
			{
		templateUrl:"views/userjobs.html",
		controller:"userJobsController"
		
	})
	
	.when("/userforum",
			{
		templateUrl:"views/userforum.html",
		controller:"userForumController"
		
	})
	.when("/blog",
			{
		templateUrl:"views/blog1.html",
		controller:"blogController"
		
	})
	.when("/allblogs",
			{
		templateUrl:"views/allblogs.html",
		controller:"allblogsController"
		
	})
	.when("/register",
	{
		templateUrl:"views/register.html",
		controller:'registerController'
	})
	.when("/chat",
	{
		templateUrl:"views/chat.html",
	controller:'chatController'
	})
	.when("/friendslist",
	{
		templateUrl:"views/friendslist.html",
	controller:'friendslistController'
	})
	
	.when("/adminblog",
			{
		templateUrl:"views/adminblog.html",
		controller:"adminBlogController"
		
	})
	.when("/adminforum",
			{
		templateUrl:"views/adminforum.html",
		controller:"adminForumController"
		
	})
	.when("/job",
	{
		templateUrl:"views/jobs.html",
		controller:"adminJobsController"
	});
});
Chatbucket.directive('fileModel', ['$parse', function ($parse) {
    return {
       restrict: 'A',
       link: function(scope, element, attrs) {
          var model = $parse(attrs.fileModel);
          var modelSetter = model.assign;
          
          element.bind('change', function(){
             scope.$apply(function(){
                modelSetter(scope, element[0].files[0]);
             });
          });
       }
    };
 }]);

Chatbucket.service('fileUpload', ['$http','$location', function ($http,$scope,$location) {
	this.uploadFileToUrl = function(file, uploadUrl,name,password,address,dob){
	       var fd = new FormData();
	       fd.append('file', file);
	       fd.append('name',name);
	       fd.append('password',password);
	       fd.append('address',address);
	       fd.append('dob',dob);
       
    console.log("fd:"+fd)
       $http.post(uploadUrl, fd, {
          transformRequest: angular.identity,
          headers: {'Content-Type': undefined}
       })
    
       .success(function(){
    	   $scope.message="registered! you can login now!!";
    	    $scope.name="";
    	    $scope.password="";  
       })
       .error(function(){
       });
    }
 }]);

Chatbucket.run( function ($rootScope, $location,$cookieStore, $http) {

	 $rootScope.$on('$locationChangeStart', function (event, next, current) {
		 console.log("$locationChangeStart")
		 
	        // redirect to login page if not logged in and trying to access a restricted page
	        var restrictedPage = $.inArray($location.path(), ['/','/','/login', '/register','/home']) === -1;
	        console.log("restrictedPage:" +restrictedPage)
	        var loggedIn = $rootScope.uname;
	        console.log("loggedIn:" +loggedIn)
	        
	        if(!loggedIn)
	        	{
	        	
	        	 if (restrictedPage) {
		        	  console.log("Navigating to login page:")
		        	

						            $location.path('/login');
		                }
	        	}
	        
			 
	        
	 }
	       );
	 	 
	 // keep user logged in after page refresh
   $rootScope.uname = $cookieStore.get('uname') || {};
    if ($rootScope.uname) {
        $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.uname; 
    }
});














Chatbucket.controller('registerController', ['$scope', 'fileUpload', function($scope,fileUpload){
    $scope.register = function(){
       var file = $scope.myFile;
       var name=$scope.name;
       var password=$scope.password;
       var address=$scope.address;
       var dob=$scope.dateofbirth;
       
       console.log("name",name);
       console.log('file is ' );
       console.dir(file);
       var uploadUrl = "http://localhost:2020/Chatbucket/fileUpload";
       fileUpload.uploadFileToUrl(file, uploadUrl,name,password,address,dob);
       $scope.message="You are sucessfully registered!!!!";
       $scope.name="";
	    $scope.password="";
	    $scope.address="";
	    $scope.dateofbirth="";
    };
 }]);

Chatbucket.service("ChatService", function($q, $timeout) {
    
    var service = {}, listener = $q.defer(), socket = {
      client: null,
      stomp: null
    }, messageIds = [];
    
    service.RECONNECT_TIMEOUT = 30000;
    service.SOCKET_URL = "/Chatbucket/chat";
    service.CHAT_TOPIC = "/topic/message";
    service.CHAT_BROKER = "/app/chat";
    
    service.receive = function() {
      return listener.promise;
    };
    
    service.send = function(message) {
    	console.log("in send function");
      var id = Math.floor(Math.random() * 1000000);
      socket.stomp.send(service.CHAT_BROKER, {
        priority: 9
      }, JSON.stringify({
        message: message,
        id: id
      }));
      messageIds.push(id);
    };
    
    var reconnect = function() {
      $timeout(function() {
        initialize();
      }, this.RECONNECT_TIMEOUT);
    };
    
    var getMessage = function(data) {
      var message = JSON.parse(data), out = {};
      out.message = message.message;
      out.username = message.username;
      out.time = new Date(message.time);
      if (_.contains(messageIds, message.id)) {
        out.self = true;
        messageIds = _.remove(messageIds, message.id);
      }
      return out;
    };
    
    var startListener = function() {
      socket.stomp.subscribe(service.CHAT_TOPIC, function(data) {
        listener.notify(getMessage(data.body));
      });
    };
    
    var initialize = function() {
      socket.client = new SockJS(service.SOCKET_URL);
      socket.stomp = Stomp.over(socket.client);
      socket.stomp.connect({}, startListener);
      socket.stomp.onclose = reconnect;
    };
    
    initialize();
    return service;
  });
Chatbucket.controller("chatController",function($scope,$http,ChatService,$rootScope)
		{
	$rootScope.userforum=true;
	$rootScope.userjobs=true;
	$rootScope.adminblog=false;
	$rootScope.adminforum=false;
	$rootScope.register=false;
	$rootScope.home=false;
	$rootScope.addjobs=false;
	$rootScope.login=false;
	$rootScope.jobs=false;
	$rootScope.blogs=true;
	$rootScope.allblogs=true;
	$rootScope.chat=true;
	$rootScope.friendslist=true;
	$rootScope.logout=true;
	console.log("in chat  controller");
	$scope.messages = [];
	  $scope.message = "";
	  $scope.max = 140;
	  
	  $scope.addMessage = function() {
		  console.log("in addmessage fn");
	    ChatService.send($scope.message);
	    $scope.message = "";
	  };

	  ChatService.receive().then(null, null, function(message) {
		  console.log("inside recieeve:"+message);
		  console.log("inside recieeve:"+$scope.message);
	    $scope.messages.push(message);
	  });
	}
		);




		
		Chatbucket.controller("JobsController",function($scope,$http)
				{
			console.log("in Jobs controller");
			$scope.addJ=function()
			{
				var jobs={
						job_name:$scope.job_name,
						job_role:$scope.job_role,
						job_requirements:$scope.job_requirements,
						job_description:$scope.job_description
				};
				var res=$http.post("http://localhost:2020/Chatbucket/addJobs",jobs);
				res.success(function(data, status, headers, config)
						{
					console.log("status:"+status);
						});
			}
				});
				Chatbucket.controller("loginController",['$cookieStore','$scope','$http','$location','$rootScope',function($cookieStore,$scope,$http,$location,$rootScope)
						{
					console.log("in login controller");
					$scope.login=function()
					{
						var logi={
							name:$scope.name,
							password:$scope.password,
							
					} 
					$http.post("http://localhost:2020/Chatbucket/authenticate",logi).then(function(response)
							{
						console.log("result data:"+response.data);
					 var r=response.data.toString();
					 console.log("response:"+r);
				     
						if(r==1)
							{
							$rootScope.userhome=true;
							$rootScope.userforum=true;
							$rootScope.userjobs=true;
							$rootScope.adminblog=false;
							$rootScope.adminforum=false;
							$rootScope.register=false;
							$rootScope.home=false;
							$rootScope.addjobs=false;
							$rootScope.login=false;
							$rootScope.jobs=false;
							$rootScope.blogs=true;
							$rootScope.allblogs=true;
							$rootScope.chat=true;
							$rootScope.friendslist=true;
							$rootScope.logout=true;
							
							console.log('logout:'+$rootScope.logout);
							console.log("logged out:"+response.data);
							$rootScope.uname=$scope.name;
							$http.defaults.headers.common['Authorization'] = 'Basic '
								+ $rootScope.uname;
						$cookieStore
								.put(
										'uname',
										$rootScope.uname)
							
							console.log("uname:"+$rootScope.uname);
							$location.path('/userHome');
							}
						if(r==0)
							{
							$scope.name="";
							$scope.password="";
							$scope.message="username/password incorrect";
							$location.path('/login');
							}
						if(r==2)
						{
							$rootScope.uname=$scope.name;
							$rootScope.home=false;
							$rootScope.login=false;
							$rootScope.register=false;
							$rootScope.jobs=true;
							$rootScope.adminblog=true;
							$rootScope.adminforum=true;
							$rootScope.blogs=false;
							$rootScope.chat=false;
							$rootScope.logout=true;
							$rootScope.blogs=false;
							$rootScope.allblogs=false;
							$rootScope.userforum=false;
							$rootScope.userjobs=false;
						$location.path('/adminHome');
						}
							}	
				 ); 
							 }
						}]);
						
				Chatbucket.controller("blogController",function($scope,$http,$rootScope)	
						{
					$rootScope.userhome=true;
					$rootScope.userforum=true;
					$rootScope.userjobs=true;
					$rootScope.adminblog=false;
					$rootScope.adminforum=false;
					$rootScope.register=false;
					$rootScope.home=false;
					$rootScope.addjobs=false;
					$rootScope.login=false;
					$rootScope.jobs=false;
					$rootScope.blogs=true;
					$rootScope.allblogs=true;
					$rootScope.chat=true;
					$rootScope.friendslist=true;
					$rootScope.logout=true;
					
					console.log(" in blog controller");
					console.log("name in allblogs:"+$rootScope.uname)
					$http.get("http://localhost:2020/Chatbucket/viewMyBlogs/"+$rootScope.uname)
							    .then(function (response) {
							    	
							    	$scope.blogs = response.data;
							    	
							    	console.log("data:"+response.data);
							    });
							 $scope.newBlog={};
								console.log("In Controller");
								$scope.addBlog=function(newBlog)
								{
									var dataObj = {
											title:$scope.title,
											description:$scope.description,
											category:$scope.category,
											postedby:$rootScope.uname
							 		};
									console.log("title:"+dataObj);
									 var res = $http.post('http://localhost:2020/Chatbucket/addBlog',dataObj);
									 $http.get("http://localhost:2020/Chatbucket/viewMyBlogs/"+$rootScope.uname)
								 	    .then(function (response) {$scope.blogs = response.data;});
								 		res.success(function(data, status, headers, config) {
								 			$scope.message = "Blog added successfully" ;
								 			console.log("status:"+status);
								 		});
								 		 
								};
				$scope.editBlog=function(blog)
				{
					console.log("inside editblog");
					console.log("blog:"+blog);
					$scope.blogedit=blog;
				}
				$scope.saveEdit=function()
				{
					console.log("in saveEdit");
					var edit=
						{
							blog_id:$scope.blogedit.blog_id,
							category:$scope.blogedit.category,
							title:$scope.blogedit.title,
							description:$scope.blogedit.description,
							postedby:$rootScope.uname
						}
					$http.put("http://localhost:2020/Chatbucket/updateBlog",edit);
					$http.get("http://localhost:2020/Chatbucket/viewMyBlogs/"+$rootScope.uname)
					    .then(function (response) {
					    	
					    	$scope.blogs = response.data;
					    	
					    	console.log("data:"+response.data);
					    });
				}
				$scope.deleteBlog=function(blogedit)
				{
					var del=
						{
					blog_id:$scope.blogedit.blog_id
						}
				$http.post("http://localhost:2020/Chatbucket/deleteBlog",del);
					$http.get("http://localhost:2020/Chatbucket/viewMyBlogs/"+$rootScope.uname)
					    .then(function (response) {
					    	
					    	$scope.blogs = response.data;
					    	
					    	console.log("data:"+response.data);
					    });
				}
						});		
				Chatbucket.controller("adminBlogController",function($scope,$http,$rootScope)	
						{	
					$rootScope.home=false;
					$rootScope.login=false;
					$rootScope.register=false;
					$rootScope.jobs=true;
					$rootScope.adminblog=true;
					$rootScope.adminforum=true;
					$rootScope.blogs=false;
					$rootScope.chat=false;
					$rootScope.logout=true;
					$rootScope.blogs=false;
					$rootScope.allblogs=false;
					$rootScope.userforum=false;
					$rootScope.userjobs=false;
					
					console.log(" in adminblog controller");
					
							 $http.get("http://localhost:2020/Chatbucket/viewBlogs")
							    .then(function (response) {
							    	
							    	$scope.blogs = response.data;
							    	
							    	console.log("data:"+response.data);
							    });
							
				$scope.appdisapp=function(adminblog)
				{
					console.log("inside appdisappblog");
					console.log("adminblog:"+adminblog);
					$scope.blogstatus=adminblog;
					
				}
				$scope.approveBlog=function()
				{
					console.log("postedby:"+$scope.blogstatus.postedby);
					console.log("in approveblog");
					var edit=
						{
							blog_id:$scope.blogstatus.blog_id,
							category:$scope.blogstatus.category,
							title:$scope.blogstatus.title,
							description:$scope.blogstatus.description,
							postedby:$scope.blogstatus.postedby,
							status:true
						}
					
					$http.put("http://localhost:2020/Chatbucket/updateBlog",edit);
					 $http.get("http://localhost:2020/Chatbucket/viewBlogs")
					    .then(function (response) {
					    	
					    	$scope.blogs = response.data;
					    	
					    	console.log("data:"+response.data);
					    });
				}
				$scope.disapproveBlog=function()
				{
					console.log("postedby:"+$scope.blogstatus.postedby);
					console.log("in disapproveblog");
					var edit=
						{
							blog_id:$scope.blogstatus.blog_id,
							category:$scope.blogstatus.category,
							title:$scope.blogstatus.title,
							description:$scope.blogstatus.description,
							postedby:$scope.blogstatus.postedby,
							status:false
						}
					$http.put("http://localhost:2020/Chatbucket/updateBlog",edit);
					 $http.get("http://localhost:2020/Chatbucket/viewBlogs")
					    .then(function (response) {
					    	
					    	$scope.blogs = response.data;
					    	
					    	console.log("data:"+response.data);
					    });
				}
				
						});		
				Chatbucket.controller("adminJobsController",function($scope,$http,$rootScope)	
						{	
					$rootScope.home=false;
					$rootScope.login=false;
					$rootScope.register=false;
					$rootScope.jobs=true;
					$rootScope.adminblog=true;
					$rootScope.adminforum=true;
					$rootScope.blogs=false;
					$rootScope.chat=false;
					$rootScope.logout=true;
					$rootScope.blogs=false;
					$rootScope.allblogs=false;
					$rootScope.userforum=false;
					$rootScope.userjobs=false;
					
					console.log(" in jobs controller");
					
							 $http.get("http://localhost:2020/Chatbucket/viewJobs")
							    .then(function (response) {
							    	
							    	$scope.jobs = response.data;
							    	
							    	console.log("data:"+response.data);
							    });
							 $scope.newJobs={};
								console.log("In Controller");
								$scope.addJobs=function(newJobs)
								{
									var dataObj = {
											job_name:$scope.job_name,
											job_role:$scope.job_role,
											job_requirements:$scope.job_requirements,
											job_description:$scope.job_description
							 		};
									console.log("title:"+dataObj);
									 var res = $http.post('http://localhost:2020/Chatbucket/addJobs',dataObj);
									 $http.get("http://localhost:2020/Chatbucket/viewJobs")
								 	    .then(function (response) {$scope.jobs = response.data;});
								 		res.success(function(data, status, headers, config) {
								 			$scope.message = data;
								 			console.log("status:"+status);
								 		});
								 		 
								};
				$scope.editJob=function(job)
				{
					console.log("inside editjob");
					console.log("job:"+job);
					$scope.jobedit=job;
				}
				$scope.saveEdit=function()
				{
					console.log("in saveEdit");
					var edit=
						{
							job_id:$scope.jobedit.job_id,
							job_name:$scope.jobedit.job_name,
							job_role:$scope.jobedit.job_role,
							job_requirements:$scope.jobedit.job_requirements,
							job_description:$scope.jobedit.job_description
						}
					$http.put("http://localhost:2020/Chatbucket/updateJob",edit);
					 $http.get("http://localhost:2020/Chatbucket/viewJobs")
					    .then(function (response) {
					    	
					    	$scope.jobs = response.data;
					    	
					    	console.log("data:"+response.data);
					    });
				}
				$scope.deleteJob=function(jobedit)
				{
					console.log("in deletejob");
					var del=
						{
					job_id:$scope.jobedit.job_id
						}
				$http.post("http://localhost:2020/Chatbucket/deleteJob",del);
					 $http.get("http://localhost:2020/Chatbucket/viewJobs")
					    .then(function (response) {
					    	
					    	$scope.jobs = response.data;
					    	
					    	console.log("data:"+response.data);
					    });
				}
						});	
				Chatbucket.controller('logoutController',function($scope,$rootScope,$http,$cookieStore)		
						{
					$http.post("http://localhost:2020/Chatbucket/logout/"+$rootScope.uname);
					$rootScope.uname=null;
					console.log("username:"+$rootScope.uname);
					console.log("uname in cookie:"+$cookieStore.get('uname'));
					$cookieStore.remove('uname');
					console.log("after deletion");
					console.log("uname in cookie:"+$cookieStore.get('uname'));
					
							console.log("logout controller called");
							$rootScope.userhome=false;
							$rootScope.login=true;
							$rootScope.register=true;
							$rootScope.userforum=false;
							$rootScope.adminforum=false;
							$rootScope.home=true;
							$rootScope.blogs=false;
							$rootScope.jobs=false;
							$rootScope.logout=false;
							$rootScope.friendslist=false;
							$rootScope.chat=false;
							$rootScope.userjobs=false;
							$rootScope.adminblog=false;
							$rootScope.allblogs=false;
							
						}
						);
				Chatbucket.controller("userJobsController",function($scope,$http,$rootScope)	
						{	
					$rootScope.userhome=true;
					$rootScope.userforum=true;
					$rootScope.userjobs=true;
					$rootScope.adminblog=false;
					$rootScope.adminforum=false;
					$rootScope.register=false;
					$rootScope.home=false;
					$rootScope.addjobs=false;
					$rootScope.login=false;
					$rootScope.jobs=false;
					$rootScope.blogs=true;
					$rootScope.allblogs=true;
					$rootScope.chat=true;
					$rootScope.friendslist=true;
					$rootScope.logout=true;
					
					console.log(" in userjobs controller");
					
							 $http.get("http://localhost:2020/Chatbucket/viewJobs")
							    .then(function (response) {
							    	
							    	$scope.jobs = response.data;
							    	
							    	console.log("data:"+response.data);
							    });
						});	
				Chatbucket.controller("adminForumController",function($scope,$http,$rootScope)	
						{	
					$rootScope.home=false;
					$rootScope.login=false;
					$rootScope.register=false;
					$rootScope.jobs=true;
					$rootScope.adminblog=true;
					$rootScope.adminforum=true;
					$rootScope.blogs=false;
					$rootScope.chat=false;
					$rootScope.logout=true;
					$rootScope.blogs=false;
					$rootScope.allblogs=false;
					$rootScope.userforum=false;
					$rootScope.userjobs=false;
					
					
					console.log(" in adminforum controller");
					
							 $http.get("http://localhost:2020/Chatbucket/viewForums")
							    .then(function (response) {
							    	
							    	$scope.forums = response.data;
							    	
							    	console.log("data:"+response.data);
							    });
							 $scope.newForum={};
								console.log("In Controller");
								$scope.addForum=function(newForum)
								{
									var dataObj = {
											category:$scope.category,
											topic:$scope.topic,
											question:$scope.question,
											
											
							 		};
									console.log("title:"+dataObj);
									 var res = $http.post('http://localhost:2020/Chatbucket/addForum',dataObj);
									 $http.get("http://localhost:2020/Chatbucket/viewForums")
								 	    .then(function (response) {$scope.forums = response.data;});
								 		res.success(function(data, status, headers, config) {
								 			$scope.message = "forum added successfully";
								 			console.log("status:"+status);
								 		});
								 		 
								};
				$scope.appdisapp=function(adminforum)
				{
				
					console.log("inside appdisappforum");
					console.log("adminforum:"+adminforum);
					$scope.forumstatus=adminforum;
				}
				$scope.approveForum=function()
				{
					console.log("category:"+$scope.forumstatus.category);
					console.log("in approveforum");
					var edit=
						{
							forum_id:$scope.forumstatus.forum_id,
							category:$scope.forumstatus.category,
							topic:$scope.forumstatus.topic,
							question:$scope.forumstatus.question,
							answer:$scope.forumstatus.answer,
							status:true
						}
					$http.put("http://localhost:2020/Chatbucket/updateForum",edit);
					 $http.get("http://localhost:2020/Chatbucket/viewForums")
					    .then(function (response) {
					    	
					    	$scope.forums = response.data;
					    	
					    	console.log("data:"+response.data);
					    });
				}
				$scope.disapproveForum=function()
				{
					console.log("in disapproveforum");
					var edit=
						{
							forum_id:$scope.forumstatus.forum_id,
							category:$scope.forumstatus.category,
							topic:$scope.forumstatus.topic,
							question:$scope.forumstatus.question,
							answer:$scope.forumstatus.answer,
							status:false
						}
					$http.put("http://localhost:2020/Chatbucket/updateForum",edit);
					 $http.get("http://localhost:2020/Chatbucket/viewForums")
					    .then(function (response) {
					    	
					    	$scope.forums = response.data;
					    	
					    	console.log("data:"+response.data);
					    });
				}
				
						});	
				Chatbucket.controller("userForumController",function($scope,$http,$rootScope)	
						{	
					$rootScope.userhome=true;
					$rootScope.userforum=true;
					$rootScope.userjobs=true;
					$rootScope.adminblog=false;
					$rootScope.adminforum=false;
					$rootScope.register=false;
					$rootScope.home=false;
					$rootScope.addjobs=false;
					$rootScope.login=false;
					$rootScope.jobs=false;
					$rootScope.blogs=true;
					$rootScope.allblogs=true;
					$rootScope.chat=true;
					$rootScope.friendslist=true;
					$rootScope.logout=true;
					
					console.log(" in forum controller");
					
							 $http.get("http://localhost:2020/Chatbucket/viewForum")
							    .then(function (response) {
							    	
							    	$scope.forums = response.data;
							    	
							    	console.log("data:"+response.data);
							    });
							 $scope.newForum={};
								console.log("In Controller");
								$scope.addForum=function(newForum)
								{
									var dataObj = {
											category:$scope.category,
											topic:$scope.topic,
											question:$scope.question,
											
											
							 		};
									console.log("title:"+dataObj);
									 var res = $http.post('http://localhost:2020/Chatbucket/addForum',dataObj);
									 $http.get("http://localhost:2020/Chatbucket/viewForum")
								 	    .then(function (response) {$scope.forums = response.data;});
								 		res.success(function(data, status, headers, config) {
								 			$scope.message = "forum added successfully";
								 			console.log("status:"+status);
								 		});
								 		 
								};
								$scope.answer=function(forum)
								{
									$scope.answerforum=forum;
									
									var ans=
										{
									forumid:$scope.answerforum.forum_id,
									answer:$scope.answerforum.answer
										}	
									 $http.post('http://localhost:2020/Chatbucket/answerForum',ans);
									$http.get("http://localhost:2020/Chatbucket/viewForum")
								    .then(function (response) {
								    	
								    	$scope.forums = response.data;
								    	
								    	console.log("data:"+response.data);
								    });
									}
								$scope.viewanswers=function(forum)
								{
									$scope.answerforum=forum;
									console.log("forumid:"+$scope.answerforum.forum_id);
									 $http.get("http://localhost:2020/Chatbucket/viewAnswers/"+$scope.answerforum.forum_id)
									    .then(function (response) {
									    	
									    	$scope.ansforums = response.data;
									    	
									    	console.log("data:"+response.data);
									    });
								}
				$scope.editForum=function(forum)
				{
					console.log("inside editforum");
					console.log("forum:"+forum);
					$scope.forumedit=forum;
				}
				$scope.saveEdit=function()
				{
					console.log("in saveEdit");
					var edit=
				
					{
							forum_id:$scope.forumedit.forum_id,
							category:$scope.forumedit.category,
							topic:$scope.forumedit.topic,
							question:$scope.forumedit.question,
							answer:$scope.forumedit.answer
						}
					$http.put("http://localhost:2020/Chatbucket/updateForum",edit);
					 $http.get("http://localhost:2020/Chatbucket/viewForum")
					    .then(function (response) {
					    	
					    	$scope.forums = response.data;
					    	
					    	console.log("data:"+response.data);
					    });
				}
				$scope.deleteForum=function(forumedit)
				{
					var del=
						{ 
					forum_id:$scope.forumedit.forum_id
						}
				$http.post("http://localhost:2020/Chatbucket/deleteForum",del)
					
					 $http.get("http://localhost:2020/Chatbucket/viewForums")
					    .then(function (response) {
					    	$scope.forums = response.data;
					    	console.log("data:"+response.data);
					    });
				}
						});	
				
				Chatbucket.controller("userHomeController",function($scope,$http,$rootScope)	
						{	
					console.log("in userHome controller");
					$scope.findfriends=function()
					{
					console.log(" in findfriends function");
					console.log("name in  findfriends:"+$rootScope.uname);
							 $http.get("http://localhost:2020/Chatbucket/findFriends/"+$rootScope.uname)
							    .then(function (response) {
							    	
							    	$scope.friends = response.data;
							    	
							    	console.log("data:"+response.data);
							    
							    });}
					
					$scope.addfriend=function(user)
					{
						$scope.isDisabled=true;
						console.log("in addfriend");
						$scope.friend=user;
						
						console.log("friendname:"+$scope.friend.name);
						console.log("username:"+$rootScope.uname);
						var fr=
							{
								name:$rootScope.uname,
								friendname:$scope.friend.name
							}
						$http.post("http://localhost:2020/Chatbucket/addFriend/",fr);
						
					}
					
						});
				Chatbucket.controller("friendslistController",function($scope,$http,$rootScope)	
						{	
					$rootScope.userhome=true;
					$rootScope.userforum=true;
					$rootScope.userjobs=true;
					$rootScope.adminblog=false;
					$rootScope.adminforum=false;
					$rootScope.register=false;
					$rootScope.home=false;
					$rootScope.addjobs=false;
					$rootScope.login=false;
					$rootScope.jobs=false;
					$rootScope.blogs=true;
					$rootScope.allblogs=true;
					$rootScope.chat=true;
					$rootScope.friendslist=true;
					$rootScope.logout=true;
					console.log("in friendslist controller");
					
					console.log("name in  friendslist:"+$rootScope.uname);
							 $http.get("http://localhost:2020/Chatbucket/viewFriends/"+$rootScope.uname)
							    .then(function (response) {
							    	
							    	$scope.friendslist = response.data;
							    	
							    	console.log("data:"+response.data);
							    
							    });
						});
				Chatbucket.controller("allblogsController",function($scope,$http,$rootScope,$route)	
						{	
					$rootScope.userhome=true;
					$rootScope.userforum=true;
					$rootScope.userjobs=true;
					$rootScope.adminblog=false;
					$rootScope.adminforum=false;
					$rootScope.register=false;
					$rootScope.home=false;
					$rootScope.addjobs=false;
					$rootScope.login=false;
					$rootScope.jobs=false;
					$rootScope.blogs=true;
					$rootScope.allblogs=true;
					$rootScope.chat=true;
					$rootScope.friendslist=true;
					$rootScope.logout=true;
					
					
					console.log("username in allblog controller:"+$rootScope.uname);
							 $http.get("http://localhost:2020/Chatbucket/viewAllBlogs")
							    .then(function (response) {
							    	
							    	$scope.blogs = response.data;
							    	
							    	console.log("data:"+response.data);
							    });
							 $scope.likeBlog=function(allblogs)
							 { 
								 $scope.allblogslike=allblogs;
								 console.log("category:"+$scope.allblogslike.likes);
								like= $scope.allblogslike.likes;
						       likes=like+1
						       console.log("likes:",likes);
						       $scope.likes=likes;
						       console.log("scope likes:"+$scope.likes);   	
						       var like=
									{
								blog_id:$scope.allblogslike.blog_id,
								category:$scope.allblogslike.category,
								title:$scope.allblogslike.title,
								description:$scope.allblogslike.description,
								postedby:$scope.allblogslike.postedby,
								status:$scope.allblogslike.status,
								likes:$scope.likes
									}
								console.log("data in like:"+like);
								console.log("postedby:"+$rootScope.uname);
								 $http.put('http://localhost:2020/Chatbucket/updateBlog',like);
								 $http.get("http://localhost:2020/Chatbucket/viewBlogs")
								    .then(function (response) {
								    	
								    	$scope.blogs = response.data;
								    	
								    	console.log("data:"+response.data);
								    });
								 
							 }
							 $scope.viewcomments=function(allblogs)
							 {
								 
								 console.log("in viewcomments fn");
								 $scope.viewcomments=allblogs;
								 console.log("blogid:"+$scope.viewcomments.blog_id);
					 $http.get("http://localhost:2020/Chatbucket/viewComments/"+$scope.viewcomments.blog_id)
								    .then(function (response) {
								    	
								    	$scope.comments = response.data;
								    	
								    	console.log("data:"+response.data);
								    	
								    });
					
							 }
							
						$scope.comment=function(allblogs)
						{
							console.log("in comment function");
							
							$scope.commentblog=allblogs;
							console.log("comment is"+$scope.commentblog.Comment);
							var comment=
								{
									blogid:$scope.commentblog.blog_id,
									name:$rootScope.uname,
									comment:$scope.commentblog.Comment
								};
							$http.post('http://localhost:2020/Chatbucket/addComment',comment);
							 $http.get("http://localhost:2020/Chatbucket/viewBlogs")
							    .then(function (response) {
							    	
							    	$scope.blogs = response.data;
							    	
							    	console.log("data:"+response.data);
							    });
							 console.log("out of addcomment");
						}
						
						});