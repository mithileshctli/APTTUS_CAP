(function() {
	angular.module('APTPS_ngCPQ').service('PAVObjConfigService', PAVObjConfigService); 
	PAVObjConfigService.$inject = ['$q', '$log', 'BaseService', 'RemoteService', 'BaseConfigService'];
	function PAVObjConfigService($q, $log, BaseService, RemoteService, BaseConfigService) {
		var service = this;
		var optionOptionAttributes = {};
		var L3PPoptionOptionAttributes = {};
		var L3PUNIPortOptionAttributes = {};
		var isOptiontoOptionAttrsvalid = false;
		var isL3ppPortOptionsValid = false;
		var isBundlePortAttrsvalid = false;
		var isL3ppUNIOptionAtrsValid = false;
		var iqdbPortOptionAttributes = {};
		
		service.isvalid = false;
		service.CCIDs = [];
		service.fieldNametoDFRMap = {};
		service.getPAVFieldMetaData = getPAVFieldMetaData;
		service.configurePAVFields = configurePAVFields;
		service.getPortOptions = getPortOptions;
		service.getL3PPPortOptions = getL3PPPortOptions;
		service.getL3PPUNIPortOptions = getL3PPUNIPortOptions;
		service.getBundlePortOptions = getBundlePortOptions;

		// helper methods;
		service.prepareOptionsList = prepareOptionsList;
		service.getPicklistValues = getPicklistValues;

		function getPAVFieldMetaData(){
			if(service.isvalid == true)
			{
				return $q.when(service.fieldNametoDFRMap);
			}

			var requestPromise = RemoteService.getPAVFieldMetaData();
			BaseService.startprogress();// start progress bar.
			return requestPromise.then(function(response){
				initializefieldNametoDFRMap(response);
				BaseService.setPAVObjConfigLoadComplete();
				return RemoteService.getOptiontoOptionAttributes().then(function(optiontoOptionattrs){
					initializeportOptions(optiontoOptionattrs);
					return RemoteService.getL3PPPortBandwidth().then(function(L3PPoptiontoOptionattrs){
						initializeL3ppPortOptions(L3PPoptiontoOptionattrs);
						return RemoteService.getL3PPUNIBandwidth().then(function(L3PUNIOptionattrs){
							initializeL3ppUNIOptionAtributes(L3PUNIOptionattrs);
							BaseService.setOptiontoOptionAttributeLoadComplete();
								return RemoteService.getIQDBBundlePortOptions().then(function(iqdbPortOptions){					
									initializeBundlePortOptions(iqdbPortOptions);
									return RemoteService.getCCIDs(BaseConfigService.opportunityId).then(function(accountIdccidsList){            
										initializeCCIDs(accountIdccidsList);
										return service.fieldNametoDFRMap;
									});
								});	
						});
					});
			    });
				
				
			});
		}
		function getPortOptions(){
			if(isOptiontoOptionAttrsvalid == true)
			{
				return optionOptionAttributes.portOptions;	
			}
			return [];
		}
		
		function getL3PPPortOptions(){
			if(isL3ppPortOptionsValid == true)
			{
				return L3PPoptionOptionAttributes.L3PPportOptions;	
			}
			return [];
		}

		function getL3PPUNIPortOptions(){
			if(isL3ppUNIOptionAtrsValid == true){
				return L3PUNIPortOptionAttributes.L3PUNIOptions;
			}
			return [];
		}
		
		function getBundlePortOptions(){
			if(isBundlePortAttrsvalid == true)
			{
				return iqdbPortOptionAttributes.bundlePortOptions;	
			}
			return [];
		}
		
		// this is applicable on page load or first time renedeing of attribute groups.
		// load picklist options from database.
		// apply dependent picklists.
		// apply default values from salesforce on first load.
		function configurePAVFields(attributeGroups, PAV){
			//avoid PAV clean for Location A and Location Z for Multi Site
			var locationsFilter = [];
			locationsFilter['Location_A__c'] = 'Location_A__c';
			locationsFilter['Location_Z__c'] = 'Location_Z__c';
			locationsFilter['vCHS_Direct_Connect__c'] = 'vCHS_Direct_Connect__c';
			locationsFilter['Media_Type__c'] = 'Media_Type__c';

			// cleanup PAV before loading picklist Drop Downs.
			_.each(attributeGroups, function(attributeGroup){
				// configure only on page load or first time...use custom property called 'isPicklistConfigComplete'.
                _.each(attributeGroup.productAtributes, function(attributeConfig){
                    var fieldName = attributeConfig.fieldName;
                    var fieldDescribe = service.fieldNametoDFRMap[fieldName].fieldDescribe;
                    if(fieldDescribe.fieldType == 'picklist'
                    	&& attributeConfig.isHidden == false)
                    {
                    	if(!_.isEmpty(attributeConfig.lovs)
                    		|| attributeConfig.isDynamicAttr == true)
	                    {
	                    	// load picklist LOV's within APTPS_CPQ.productAtribute for dynamic attributes and custom attributes from custom settings: APTPS_ProdSpec_DynAttr__c. 
                    		attributeConfig['picklistValues'] = getPicklistValues(prepareOptionsList(attributeConfig.lovs));
                    		
                    		// load Other field values to Other field.
	                    	var pavValue = PAV[fieldName];
							var quoteSoruceCode = BaseConfigService.proposal.quoteSourceCode;
	                    	if((!_.has(PAV, 'isDefaultLoadComplete')
								|| PAV.isDefaultLoadComplete == false)
								&& _.isString(pavValue))
							{
								// load Other field values to Other field.
								if(_.contains(_.pluck(attributeConfig.picklistValues, 'value'), 'Other')
									&& pavValue.endsWith('**'))
								{
									if(!_.isUndefined(quoteSoruceCode) && quoteSoruceCode.toLowerCase() == 'LITE'.toLowerCase() && fieldName.toLowerCase() == 'Service_Term__c'.toLowerCase()){
										var pavST = pavValue.slice( 0, pavValue.lastIndexOf( "**" ));
										PAV[fieldName+'Other'] = parseInt(pavST);
										PAV[fieldName] = 'Other';
									}else{
										PAV[fieldName+'Other'] = pavValue.slice( 0, pavValue.lastIndexOf( "**" ));
										PAV[fieldName] = 'Other';
									}											
								}

								// to support deprecated attributes
								if(pavValue.endsWith('***')){
									PAV[fieldName+'Legacy'] = pavValue.slice( 0, pavValue.lastIndexOf( "***" ));
			                    	PAV[fieldName] = 'Legacy';
			                    	attributeConfig['picklistValues'].push(selectoptionObject(true, 'Legacy', 'Legacy', false));
								}
							}
							
							if(attributeConfig.includeDependentP){
								//var dependentValues  = fieldDescribe.picklistValues;
								var controllingField = fieldDescribe.controllerName;
								var lovs = [];
								var mergedPicklistValues = [];
								var replaceLovs = [];
								
								_.each(attributeConfig.lovs, function(item){
									lovs[item] = item;
								});
								
								
	                    		applyDependentLOVSConfig(attributeConfig, PAV, fieldName, controllingField);
								
								_.each(attributeConfig.picklistValues, function(item){
									if(_.has(lovs, item.label)){
										mergedPicklistValues.push(item.label);										
									}
								});
								
								if(!_.isEmpty(mergedPicklistValues)){
									attributeConfig['picklistValues'] = getPicklistValues(prepareOptionsList(mergedPicklistValues));
									//attributeConfig.lovs = replaceLovs;
								}
							}

                    	}else{
                    		// load Normal picklist LOV's from Salesforce config.
	                    	attributeConfig['picklistValues'] = fieldDescribe.picklistValues;
							var quoteSoruceCode = BaseConfigService.proposal.quoteSourceCode;
	                    	// load Other field value to Other field.
	                    	var pavValue = PAV[fieldName];
	                    	if((!_.has(PAV, 'isDefaultLoadComplete')
								|| PAV.isDefaultLoadComplete == false)

								&& _.isString(pavValue)){

	                    		// load Other field value to Other field.
								if(_.contains(_.pluck(attributeConfig.picklistValues, 'value'), 'Other') 
									&& pavValue.endsWith('**'))
			                    {
									if(!_.isUndefined(quoteSoruceCode) && quoteSoruceCode.toLowerCase() == 'LITE'.toLowerCase() && fieldName.toLowerCase() == 'Service_Term__c'.toLowerCase()){
										var pavST = pavValue.slice( 0, pavValue.lastIndexOf( "**" ));
										PAV[fieldName+'Other'] = parseInt(pavST);
										PAV[fieldName] = 'Other';
									}else{
										PAV[fieldName+'Other'] = pavValue.slice( 0, pavValue.lastIndexOf( "**" ));
										PAV[fieldName] = 'Other';
									}
			                    }

			                    // to support deprecated attributes
			                    if(pavValue.endsWith('***')){
			                    	PAV[fieldName+'Legacy'] = pavValue.slice( 0, pavValue.lastIndexOf( "***" ));
			                    	PAV[fieldName] = 'Legacy';
			                    	attributeConfig['picklistValues'].push(selectoptionObject(true, 'Legacy', 'Legacy', false));
			                    }
			                }

							if(fieldName == 'CONTROL_CENTRAL_ID__c'){
								attributeConfig['picklistValues'] = fieldDescribe.picklistValues;
							}

	                    	// load dependent picklists if current field is dependentField.
	                    	if(fieldDescribe.isDependentPicklist == true)
	                    	{
	                    		var controllingField = fieldDescribe.controllerName;
	                    		applyDependentLOVSConfig(attributeConfig, PAV, fieldName, controllingField);	
	                    	}
	                    	
	                    	// if 'Other' LOV option exists in the database then add the previously selected value to options.
		                    /*var selectedOtherValue = PAV[fieldName+'Other'];
		                    if(!_.isUndefined(selectedOtherValue)
		                    	&& !_.contains(_.pluck(attributeConfig.picklistValues, 'value'), selectedOtherValue) 
		                    	&& _.contains(_.pluck(attributeConfig.picklistValues, 'value'), 'Other'))
		                    {
		                    	attributeConfig.picklistValues.push(selectoptionObject(true, selectedOtherValue, selectedOtherValue, false));
		                    }*/ 
		                    
	                    	// if dependend selected value does not exists in the options then set the PAV to null
							var selectedPAVValue = PAV[fieldName];
							if(!_.contains(_.pluck(attributeConfig.picklistValues,  'value'), selectedPAVValue))
							{
								if(!_.has(locationsFilter, fieldName))
									PAV[fieldName] = null;// set the PAV of field to null.
							}
						}

						if(!_.has(PAV, 'isDefaultLoadComplete')
							|| PAV.isDefaultLoadComplete == false)
	                    {
	              			// set the PAV to null if undefined. - To avoid extra dropdown if it is a picklists.
		                    PAV[fieldName] = _.isUndefined(PAV[fieldName]) ? null : PAV[fieldName];
		                	
		                	// set pav to default value from salesforce configuration.
		                	var defaultValue = fieldDescribe.defaultValue;
		                	PAV[fieldName] = !_.isUndefined(defaultValue) && _.isNull(PAV[fieldName]) ? defaultValue : PAV[fieldName];      	
	                    }
                    }
					else{
						
					}
				})
					
            });
				
			PAV['isDefaultLoadComplete'] = true;
            res = {pavConfigGroups: attributeGroups, PAVObj: PAV};
			return res;
		}

		// ###################### private methods.###############################
		function initializefieldNametoDFRMap(response){
			service.isvalid = true;
			var fieldNametoFieldDescribeWrapperMap = response.fieldNametoFieldDescribeWrapperMap;
			_.each(fieldNametoFieldDescribeWrapperMap, function(fdrWrapper, fieldName){
				var fieldDescribe = getFieldDescribe(fdrWrapper);
				var dPicklistObj = {};
				if(fieldDescribe.fieldType == 'picklist'
					&& fieldDescribe.isDependentPicklist == true)
				{
					var controller = fieldDescribe.controllerName;
					
					if(!_.isUndefined(fieldNametoFieldDescribeWrapperMap[controller])){
						var controllingpicklistOptions = fieldNametoFieldDescribeWrapperMap[controller].picklistOptions;
						dPicklistObj = getStructuredDependentFields(fdrWrapper.picklistOptions, controllingpicklistOptions);
					}	
				}
				
				service.fieldNametoDFRMap[fieldName] = {fieldDescribe:fieldDescribe, dPicklistObj:dPicklistObj};
			})
		}
		
		function initializeCCIDs(accountIdccidsList){
			//empty value
			
			service.CCIDs.push({
						active: true,
						defaultValue: false,
						label: "--None--",
						value: null	
			});
			//push items from backend
			_.each(accountIdccidsList, function(accountIdccids){
				var controlCenterIds = accountIdccids.CCID;			
				_.each(controlCenterIds, function(item){
					service.CCIDs.push({
							active: true,
							defaultValue: false,
							label: item,
							value: item
					});
				})
			})	
			service.fieldNametoDFRMap['CONTROL_CENTRAL_ID__c'].fieldDescribe.picklistValues = service.CCIDs;	
		}

		function initializeportOptions(result){
			isOptiontoOptionAttrsvalid = true;
			var portOptions = [];
			_.each(result.portOptions, function(portOption){
				portOptions.push(portOption);
			})
			optionOptionAttributes ={ portOptions: portOptions };
		}
		
		function initializeL3ppPortOptions(result){
			isL3ppPortOptionsValid = true;
			var L3PPportOptions = [];
			_.each(result.L3PPPortBandwidth, function(l3PPportOption){
				L3PPportOptions.push(l3PPportOption);
			})
			L3PPoptionOptionAttributes ={ L3PPportOptions: L3PPportOptions };
		}
		
		function initializeL3ppUNIOptionAtributes(result){
			isL3ppUNIOptionAtrsValid = true;
			var L3PUNIOptions = [];
			_.each(result.L3PPUNIBandwidth, function(l3PPuniAtrs){
				L3PUNIOptions.push(l3PPuniAtrs);
			})
			L3PUNIPortOptionAttributes ={ L3PUNIOptions: L3PUNIOptions };
		}
		
		function initializeBundlePortOptions(result){
			isBundlePortAttrsvalid = true;
			var bundlePortOptions = [];
			_.each(result.bundlePortOptions, function(item){
				bundlePortOptions.push(item);
			});
			iqdbPortOptionAttributes ={ bundlePortOptions: bundlePortOptions };
		}
		
		// load dropdown values of all dependent fields based on controlling field value selected..applicable on initial load of attributes.
		function applyDependentLOVSConfig(attributeConfig, PAV, dependentField, controllingField){
            var cSelectedPAVValue = _.has(PAV, controllingField) ? PAV[controllingField] : null;
            var options = [];
            var dPicklistConfig = service.fieldNametoDFRMap[dependentField].dPicklistObj;
            if(_.has(dPicklistConfig, cSelectedPAVValue))
            {
            	options = dPicklistConfig[cSelectedPAVValue].slice();// do a slice to cline the list.
            }
            options.splice(0, 0, selectoptionObject(true, '--None--', null, false));
            attributeConfig.picklistValues = options;
		}
		
		// prepare javascript version  of fieldDescribe based on Schema.DescribeFieldResult
		function getFieldDescribe(fdrWrapper){
			var res = {};
			var fieldDescribe = fdrWrapper.fdr;
			var fieldDescribe_addl = fdrWrapper.fdr_additional;
			var fieldAPI = fdrWrapper.fieldName;

			res['fieldType'] = getFieldType(fieldDescribe.type);
			res['fieldName'] = fieldDescribe.name;
			res['fieldLabel'] = fieldDescribe.label;
			res['picklistValues'] = getPicklistValues(fieldDescribe.picklistValues);
			res['isDependentPicklist'] = fieldDescribe.dependentPicklist;// Returns true if the picklist is a dependent picklist, false otherwise.
			res['controllerName'] = fieldAPI.search("ProductAttributeValueId1__r") != -1 ? 'ProductAttributeValueId1__r.'+fieldDescribe.controllerName : fieldDescribe.controllerName;// Returns the token of the controlling field.
			res['isUpdateable'] = fieldDescribe.updateable;//Returns true if the field can be edited by the current user, or child records in a master-detail relationship field on a custom object can be reparented to different parent records; false otherwise.
			res['isCalculated'] = fieldDescribe.calculated;// Returns true if the field is a custom formula field, false otherwise. Note that custom formula fields are always read-only.
			res['isCreateable'] = fieldDescribe.createable;// Returns true if the field can be created by the current user, false otherwise.
			res['idLookup'] = fieldDescribe.idLookup;// Returns true if the field can be used to specify a record in an upsert method, false otherwise.
			res['isNillable'] = fieldDescribe.nillable;// Returns true if the field is nillable, false otherwise. A nillable field can have empty content. A non-nillable field must have a value for the object to be created or saved.
			res['isUnique'] = fieldDescribe.unique;// Returns true if the value for the field must be unique, false otherwise
			
			// additional map result.
			res['defaultValue'] = fieldDescribe_addl.defaultValue;
			if(res.fieldType== 'picklist')
			{
				var defaultLOV = _.findWhere(res.picklistValues, {defaultValue:true});
				res['defaultValue'] = !_.isUndefined(defaultLOV) ? defaultLOV.value : null;
			}
			return res;
		}

		// return HTML matching fieldtype based on Salesforce field Type.
		function getFieldType(sfdctype){
			var res = 'text';// default.
			if(sfdctype == 'picklist'
				|| sfdctype == 'multiPicklist')
				return 'picklist';
			else if(sfdctype == 'string'
					|| sfdctype == 'textarea'
					|| sfdctype == 'phone'
					|| sfdctype == 'encryptedstring')
				return 'text';
			else if(sfdctype == 'boolean')
				return 'checkbox';
			else if(sfdctype == 'combobox')
				return '';
			else if(sfdctype == 'currency'
					|| sfdctype == 'integer'
					|| sfdctype == 'double'
					|| sfdctype == 'percent')
				return 'number';
			else if(sfdctype == 'date')
				return 'date';
			else if(sfdctype == 'datetime')
				return 'datetime';
			else if(sfdctype == 'email')
				return 'email';
			else if(sfdctype == 'reference')
				return '';
			else if(sfdctype == 'time')
				return 'time';
			else if(sfdctype == 'url')
				return 'url';
			return 'text';
			return res;
		}

		// add '--None--' Options at index 0 for salesforce default config.
		function getPicklistValues(ples){
			var res = [];// defaultValue
			// add a blank option.{--None--}
			res = ples;
			res.splice(0, 0, selectoptionObject(true, '--None--', null, false));
			return res;
		}

		// convert map<String, list<String>> of string to Map<Strin, List<Schema.PicklistEntry>>(JSON).
		function prepareOptionsMap(objResult){
			var res = {};
			_.each(objResult, function(plovs, cLOV){
				res[cLOV] = prepareOptionsList(plovs);
			})
			return res;
		}

		// convert list of string to List<Schema.PicklistEntry>.
		function prepareOptionsList(lovs){
			var res = [];
			res = _.map(lovs, function(lov){
					return selectoptionObject(true, lov, lov, false);
				});
			return res;
		}

		// object structure of Schema.PicklistEntry.
		function selectoptionObject(active, label, value, isdefault){
			return {active:active, label:label, value:value, defaultValue:isdefault};
		}

		function getStructuredDependentFields(dPicklistOptions, cPicklistOptions){
			var res = {};
			var objResult = {};
			//set up the results
			//create the entry with the controlling label
			_.each(cPicklistOptions, function(picklistOption){
				objResult[picklistOption.label] = [];
			})
			//cater for null and empty
			objResult[''] = [];
			objResult[null] = [];

			//if valid for is empty, skip
			_.each(dPicklistOptions, function(dPicklistOption){
				//iterate through the controlling values
				_.each(cPicklistOptions, function(cPicklistOption, cIndex){
					if(testBit(dPicklistOption.validFor, cIndex))
					{
						var cLabel = cPicklistOption.label;
						objResult[cLabel].push(dPicklistOption.label);
					}
				})
			})
			// convert list of values to 'selectoptionObject' format.
			res = prepareOptionsMap(objResult);
			return res;
		}

		var base64 = new sforce.Base64Binary("");
        function testBit (validFor, pos) {
			validFor = base64.decode(validFor);
			var byteToCheck = Math.floor(pos/8);
			var bit = 7 - (pos % 8);
			return ((Math.pow(2, bit) & validFor.charCodeAt(byteToCheck)) >> bit) == 1;
		}
		
		if(!String.prototype.endsWith){
		  String.prototype.endsWith = function(searchString, position){
			  var subjectString = this.toString();
			  if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
				position = subjectString.length;
			  }
			  position -= searchString.length;
			  var lastIndex = subjectString.indexOf(searchString, position);
			  return lastIndex !== -1 && lastIndex === position;
		  };
		}
	}
})();