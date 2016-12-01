(function() {
	angular.module('APTPS_ngCPQ').directive('messagesView', messagesView);
	messagesView.$inject = ['$compile',];
	function messagesView($compile) {
		return{restrict:"A",
        link:function(scope,element,attributes){
			var g=attributes.messages, 
			e = '<div ng-repeat="msg in '+g+'" class="alert-box error"><span>error: </span>{{msg.text}}</div>'; 
			element.html('').append($compile(e)(scope))}}
	}
})();