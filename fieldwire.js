(function() {
	// All known comparison-operators.
	// Please note that operators have to get more specific towards the end of
	// the array, an operator may not be containd by another that comes before
	// it. Negative example: ['=#=', '#=']
	var operators = ['=', '!=', '>', '<', '>=', '<=', '%=', '*='];
	// Classname of a input-field.
	var $fields = $('.Inputfield');
	
	// Structure this script uses to connect the field-relationships.
	var struct = {};
	// Whether to animate changes in visibility. This is not an option! Do not
	// change this value unless you know what you are doing!
	var usesAnimation = false;
	
	// Evaluates two given values using a comparison-operator.
	// 
	// operator: String that can be found in the `operators` array.
	// v0: String extracted from the live HTML input/textarea/select field.
	// v1: String specified in the Processwire backend.
	// 
	// returns: bool: `true` if the field with the value `v0` should be visible.
	function evaluateOperatorWithValues(operator, v0, v1) {
		switch (operator) {
		case '=': // is equal to
			return v0 == v1;
		case '!=': // is not equal to
			return v0 != v1;
		case '>': // is greater than
			return parseFloat(v0) > parseFloat(v1);
		case '<': // is less than
			return parseFloat(v0) < parseFloat(v1);
		case '>=': // is greater than or equal to
			return parseFloat(v0) >= parseFloat(v1);
		case '<=': // is less than or equal to
			return parseFloat(v0) <= parseFloat(v1);
		case '%=': // contains substring
		case '*=': // contains substring
			return v0.indexOf(v1) !== -1;
		default:
			console.error('The operator “'+operator+'” is not implemented in evaluateOperatorWithValues().');
		}
	}
	
	// Returns a value based on an field.
	function comparableValueForField(field) {
		var object = field.input;
		var value;
		
		if (object.tagName === 'SELECT') {
			// <select>: value of selected option
			value = object.options[object.selectedIndex].value || '';
		} else if (object.tagName === 'INPUT' && object.type === 'checkbox') {
			// <input type=checkbox>: 1 for checked, 0 for unchecked
			value = object.checked ? '1' : '0';
		} else if (object.tagName === 'INPUT' && object.type === 'radio') {
			// <input type=radio>: value of the selected input or ''
			var checked = document.querySelector('input[name='+object.name+']:checked');
			value = checked ? checked.value : '';
		} else {
			// <input>, <textarea>, etc.: value of the object
			value = object.value || '';
		}
		
		// Add your own modifier here!
		switch (field.conditions.modifier) {
		case 'lowercase':
			value = value.toLowerCase();
			break;
		case 'uppercase':
			value = value.toUpperCase();
			break;
		case 'length':
			value = value.length;
			break;
		}
		
		return value;
	}
	
	// Applies all conditions of a field to that field. This results in either
	// showing or hiding the field. Conditions are combined using the AND
	// operator, so they all have to evaluate to `true` to show the field.
	// 
	// field: A field taken from the `struct` object.
	function applyConditions(field) {
		var show = true;
		
		for (var i = 0; i < field.conditions.length; i++) {
			var condition = field.conditions[i];
			var ref = struct[condition.ref];
			
			show &= ref.visible;
			show &= evaluateOperatorWithValues(
				condition.operator,
				comparableValueForField(ref),
				condition.value
			);
		}
		
		var $wrapper = $(field.wrapper);
		
		if (show) {
			$wrapper[(usesAnimation) ? 'slideDown' : 'show']();
			$wrapper.removeClass('fieldwire-hidden');
			field.$inputs.prop('disabled', false);
			field.visible = true;
		} else {
			$wrapper[(usesAnimation) ? 'slideUp' : 'hide']();
			$wrapper.addClass('fieldwire-hidden');
			field.$inputs.prop('disabled', true);
			field.visible = false;
		}
		
		// Notify all dependent fields of this change.
		evalueateDependents(field.wrapper.id);
	}
	
	// Evaluates the conditions for all fields that depend on a given field.
	// This function intentionally does not take a field object directly so
	// it always uses the most up-to-date version of a field.
	// 
	// fieldId: The unique identifier used in the `struct` object.
	function evalueateDependents(fieldId) {
		var field = struct[fieldId];
		
		for (var i = 0; i < field.dependents.length; i++) {
			applyConditions(struct[field.dependents[i]]);
		}
	}
	
	// Create the basic `struct` structure.
	$fields.each(function() {
		var wrapper = this;
		// collect “input-like” elements
		var $inputs = $(this).find('input,textarea,select');
		
		struct[this.id] = {
			// the HTML node of the field
			wrapper: wrapper,
			// the HTML node of the first “input-like” element
			input: $inputs.get(0),
			// all “input-like” elements as a jQuery collection
			$inputs: $inputs,
			// this list will be filled after this $.each loop
			dependents: [],
			// fields are – by default – visible
			visible: true,
			// the condition as a string, empty string for no condition
			showIf: this.dataset.showIf || ''
		};
		
		// listen for opportunities to reevaluate all dependent fields
		$inputs.on('input change blur', function() {
			usesAnimation = true;
			evalueateDependents(wrapper.id);
		});
	});
	
	// Add the dependencies to `struct` as well as the conditions.
	$fields.each(function() {
		// example: 'key=value,age>18'
		var showIf = struct[this.id].showIf;
		// example: ["key=value", "age>18"]
		var rawConditions = showIf.split(',');
		var conditions = [];
		
		for (var i = 0; i < rawConditions.length; i++) {
			var rawCondition = rawConditions[i];
			var operator;
			
			// find the matching operator
			for (var index in operators) {
				if (rawCondition.split(operators[index]).length === 2) {
					operator = operators[index];
				} else { continue; }
			}
			
			if (operator === undefined) {
				// no operator for this condition
				struct[this.id].conditions = [];
				continue;
			}
			
			// example: ["fieldname", "value"] or ["fieldname.count", "value"]
			var splits = rawCondition.split(operator);
			// example: ["fieldname"] or ["fieldname", "count"]
			var lhs = splits[0].split('.');
			var fieldname = lhs[0].trim();
			
			conditions.push({
				// id of the filed this condition depends on (v0)
				ref: 'wrap_Inputfield_'+fieldname,
				// the operator used to compare the value of `ref` to `value`
				operator: operator,
				// the comparison-value defined in the Processwire backend (v1)
				value: splits[1].replace(/^\s*'?(.*)'\s*$/, '$1'),
				modifier: lhs[1] || null
			});
			
			// add this field as dependent to `conditions.ref`
			struct['wrap_Inputfield_'+fieldname].dependents.push(this.id);
		}
		
		struct[this.id].conditions = conditions;
		
		applyConditions(struct[this.id]);
	});
}());