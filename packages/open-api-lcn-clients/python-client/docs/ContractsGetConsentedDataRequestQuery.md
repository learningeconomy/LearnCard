# ContractsGetConsentedDataRequestQuery


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**anonymize** | **bool** |  | [optional] 
**credentials** | [**ContractsGetConsentedDataForDidRequestQueryCredentials**](ContractsGetConsentedDataForDidRequestQueryCredentials.md) |  | [optional] 
**personal** | **Dict[str, bool]** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consented_data_request_query import ContractsGetConsentedDataRequestQuery

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedDataRequestQuery from a JSON string
contracts_get_consented_data_request_query_instance = ContractsGetConsentedDataRequestQuery.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedDataRequestQuery.to_json())

# convert the object into a dict
contracts_get_consented_data_request_query_dict = contracts_get_consented_data_request_query_instance.to_dict()
# create an instance of ContractsGetConsentedDataRequestQuery from a dict
contracts_get_consented_data_request_query_from_dict = ContractsGetConsentedDataRequestQuery.from_dict(contracts_get_consented_data_request_query_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


