import json
from estimate_report import EstimateReport
from invoice_report import InvoiceReport


def lambda_handler(event, context=None):
    report_type = event.pop('document')
    report_class_name = f'{report_type.capitalize()}Report'
    report_class_instance = globals()[report_class_name](event)
    response = report_class_instance.generate()
    report_class_instance.to_file(f'dest/{report_type}.html')
    return response

if __name__ == "__main__":
    with open('api/estimate.json', 'r', encoding='utf-8') as f:
        request = f.read()
        request = json.loads(request)
    lambda_handler(request)
