# ContractsGetConsentedData200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**credentials** | [**ContractsGetConsentedDataForContract200ResponseRecordsInnerCredentials**](ContractsGetConsentedDataForContract200ResponseRecordsInnerCredentials.md) |  | 
**personal** | **Dict[str, str]** |  | 
**var_date** | **str** |  | 

## Example

```python
from openapi_client.models.contracts_get_consented_data200_response_records_inner import ContractsGetConsentedData200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedData200ResponseRecordsInner from a JSON string
contracts_get_consented_data200_response_records_inner_instance = ContractsGetConsentedData200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedData200ResponseRecordsInner.to_json())

# convert the object into a dict
contracts_get_consented_data200_response_records_inner_dict = contracts_get_consented_data200_response_records_inner_instance.to_dict()
# create an instance of ContractsGetConsentedData200ResponseRecordsInner from a dict
contracts_get_consented_data200_response_records_inner_from_dict = ContractsGetConsentedData200ResponseRecordsInner.from_dict(contracts_get_consented_data200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


