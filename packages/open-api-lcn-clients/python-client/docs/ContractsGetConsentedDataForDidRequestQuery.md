# ContractsGetConsentedDataForDidRequestQuery


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**credentials** | [**ContractsGetConsentedDataForContractRequestQueryCredentials**](ContractsGetConsentedDataForContractRequestQueryCredentials.md) |  | [optional] 
**personal** | **Dict[str, bool]** |  | [optional] 
**id** | [**BoostGetBoostsRequestQueryUri**](BoostGetBoostsRequestQueryUri.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consented_data_for_did_request_query import ContractsGetConsentedDataForDidRequestQuery

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedDataForDidRequestQuery from a JSON string
contracts_get_consented_data_for_did_request_query_instance = ContractsGetConsentedDataForDidRequestQuery.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedDataForDidRequestQuery.to_json())

# convert the object into a dict
contracts_get_consented_data_for_did_request_query_dict = contracts_get_consented_data_for_did_request_query_instance.to_dict()
# create an instance of ContractsGetConsentedDataForDidRequestQuery from a dict
contracts_get_consented_data_for_did_request_query_from_dict = ContractsGetConsentedDataForDidRequestQuery.from_dict(contracts_get_consented_data_for_did_request_query_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


