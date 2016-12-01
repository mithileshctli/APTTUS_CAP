(function(){
	'use strict';
	/*
    This is our main launch point from Angular. 
    We'll put anything to do with the
    general well being of our app in this file. 
    
    Our module will be called 'APTPS_ngCPQ'.
 	*/
	angular.module('APTPS_ngCPQ',
		['ngProgress', 'ui.bootstrap', 'dialogs', 'dirPagination']
		)
}).call(this);

// angular.module('APTPS_ngCPQ', ['ngProgress']);
// angular.module('APTPS_ngCPQ').config(['',function() {
	
// }])