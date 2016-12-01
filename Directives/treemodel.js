(function() {
	angular.module('APTPS_ngCPQ').directive('treeModel', treeModel);
	treeModel.$inject = ['$compile', '$parse'];
	function treeModel($compile, $parse) {
			return{restrict:"A",
            link:function(scope,element,attributes){
				var a=attributes.treeId,g=attributes.treeModel,e=attributes.nodeLabel||"label",d=attributes.nodeChildren||"children",reloadProductGroups = $parse(attributes.callbackFn),
                e='<ul><li data-ng-repeat="node in '+g+'"><i class="collapsed" data-ng-show="node.'+d+'.length && node.collapsed" data-ng-click="'+a+'.selectNodeHead(node)"></i><i class="expanded" data-ng-show="node.'+d+'.length && !node.collapsed" data-ng-click="'+a+'.selectNodeHead(node)"></i><i class="normal" data-ng-hide="node.'+
				d+'.length"></i> <span data-ng-class="{\'selected\' : node.selected, \'pointer\': !node.isproduct, \'default\': node.isproduct}" data-ng-click="node.isproduct || '+a+'.selectNodeLabel(node)">{{node.'+e+'}}</span><div data-ng-hide="node.collapsed" data-tree-id="'+a+'" data-tree-model="node.'+d+'" data-node-id='+(attributes.nodeId||"id")+" data-node-label="+e+" data-node-children="+d+"></div></li></ul>";
	            a&&g&&((scope[a]=scope[a]||{},scope[a].selectNodeHead=scope[a].selectNodeHead||function(a){a.collapsed=!a.collapsed},scope[a].selectNodeLabel=scope[a].selectNodeLabel||function(c){scope[a].currentNode&&scope[a].currentNode.selected&&
				(scope[a].currentNode.selected=void 0);c.selected="selected";scope[a].currentNode=c;reloadProductGroups(scope, {arg1:c.Parent,arg2:null,arg3:null});}),element.html('').append($compile(e)(scope)))}}
	}
})();