# ContractsGetConsentedDataForDid200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**credentials** | [**List[ContractsGetConsentedDataForDid200ResponseRecordsInnerCredentialsInner]**](ContractsGetConsentedDataForDid200ResponseRecordsInnerCredentialsInner.md) |  | 
**personal** | **Dict[str, str]** |  | [optional] 
**var_date** | **str** |  | 
**contract_uri** | **str** |  | 

## Example

```python
from openapi_client.models.contracts_get_consented_data_for_did200_response_records_inner import ContractsGetConsentedDataForDid200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedDataForDid200ResponseRecordsInner from a JSON string
contracts_get_consented_data_for_did200_response_records_inner_instance = ContractsGetConsentedDataForDid200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedDataForDid200ResponseRecordsInner.to_json())

# convert the object into a dict
contracts_get_consented_data_for_did200_response_records_inner_dict = contracts_get_consented_data_for_did200_response_records_inner_instance.to_dict()
# create an instance of ContractsGetConsentedDataForDid200ResponseRecordsInner from a dict
contracts_get_consented_data_for_did200_response_records_inner_from_dict = ContractsGetConsentedDataForDid200ResponseRecordsInner.from_dict(contracts_get_consented_data_for_did200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


