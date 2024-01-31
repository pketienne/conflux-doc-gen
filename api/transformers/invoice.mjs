import data from '../invoice-raw.json' with { type: 'json' }

var materials = data.expenses
var labors = data.time

var payload = {
	client: {
		person: data.invoiceData.client_name,
		company: data.invoiceData.client_company,
		email: data.invoiceData.client_email,
		address: data.invoiceData.client_address,
		website: data.invoiceData.client_website,
		phone: data.invoiceData.client_phone,
	},
	contractor: {
		person: data.contractor.name,
		company: data.contractor.company,
		email: data.contractor.email,
		address: data.contractor.address,
		website: data.contractor.website,
		phone: data.contractor.phone,
	},
	instance: {
		project: data.invoiceData.project_name,
		title: data.invoiceData.invoice_title,
		date: data.invoiceData.invoice_date,
		notes: data.invoiceData.invoice_notes,
		terms: data.invoiceData.contractor_terms,
	},
	materials: [],
	labors: [],
	totals: [],
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

function transform_materials() {
	var num_of_materials = get_num_entries(materials)

	for (var i = 0; i < num_of_materials; i++) {
		var description = materials.invoice_expense_description[i]
		var price = materials.invoice_expense_price[i]
		var adjustment = materials.invoice_expense_adjustment[i]

		let entry = {
			description: description,
			price: (price * adjustment).toFixed(2),
		}

		payload.materials.push(entry)
	}
}

function transform_labors() {
	var num_of_labors = get_num_entries(labors)
	var entries = []

	for (var i = 0; i < num_of_labors; i++) {
		var description = labors.invoice_time_description[i]
		var quantity = labors.invoice_quantity[i]
		var price = labors.invoice_unit_price[i]
		var adjustment = labors.invoice_time_adjustment[i]

		let entry = {
			description: description,
			quantity: quantity.toString(),
			price: (price * adjustment).toFixed(2),
			total: ((price * adjustment) * quantity).toFixed(2),
		}

		payload.labors.push(entry)
	}
}

function calculate_totals() {
	var materials_total =  0
	var labors_total = 0

	payload.materials.forEach((m) => {
		materials_total += Number(m.price)
	})

	payload.labors.forEach((l) => {
		labors_total += Number(l.price)
	})

	payload.totals.push({ materials: materials_total.toFixed(2)})
	payload.totals.push({ labor: labors_total.toFixed(2) })
	payload.totals.push({ due: (materials_total + labors_total).toFixed(2)})
}

transform_materials()
transform_labors()
calculate_totals()

console.log(payload)
