import data from '../estimate-raw.json' with { type: 'json' }


var payload = {
	client: {
		person: data.info.client_name,
		company: data.info.client_company,
		email: data.info.client_email,
		address: data.info.client_address,
		website: data.info.client_website,
		phone: data.info.client_phone,
	},
	contractor: {
		person: data.contractor.name,
		company: data.contractor.company,
		email: data.contractor.email,
		address: data.contractor.address,
		website: data.contractor.website,
		phone: data.contractor.phone,
	},
	project: {
		name: data.info.project_name,
		title: data.info.title,
		date: data.info.date,
		notes: data.info.notes,
		terms: data.info.terms,
	},
	estimates: [],
}

function get_num_entries(expenses) {
	var property_lengths = []

	for (const property in expenses) {
		property_lengths.push(expenses[property].length)
	}

	let set_of_property_lengths = [...new Set(property_lengths)]

	if (set_of_property_lengths.length = 1) {
		return set_of_property_lengths[0]
	} else {
		return false
	}
}

function transform_estimates() {
	var num_of_estimates = get_num_entries(data.tasks)

	for (var i = 0; i < num_of_estimates; i++) {
		var cost_code = '{ not-yet-implemented }'
		var name = data.tasks.task_name[i]
		var description = data.tasks.task_description[i]
		var quantity = data.tasks.item_quantity[i]
		var cost = data.tasks.item_cost[i]
		var tax = data.tasks.item_tax[i]
		var markup = data.tasks.item_markup[i]
		var net = '{ not-yet-implemented }'

		let entry = {
			cost_code: cost_code,
			name: name,
			description: description,
			quantity: quantity,
			cost: cost,
			tax: tax,
			markup: markup,
			net: net,
		}

		payload.estimates.push(entry)
	}
}

transform_estimates()

console.log(payload)
