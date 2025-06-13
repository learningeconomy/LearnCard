# ContractsGetConsentedContractsRequestQuery


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**read** | [**ContractsGetConsentedContractsRequestQueryRead**](ContractsGetConsentedContractsRequestQueryRead.md) |  | [optional] 
**write** | [**ContractsGetConsentedContractsRequestQueryWrite**](ContractsGetConsentedContractsRequestQueryWrite.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consented_contracts_request_query import ContractsGetConsentedContractsRequestQuery

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedContractsRequestQuery from a JSON string
contracts_get_consented_contracts_request_query_instance = ContractsGetConsentedContractsRequestQuery.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedContractsRequestQuery.to_json())

# convert the object into a dict
contracts_get_consented_contracts_request_query_dict = contracts_get_consented_contracts_request_query_instance.to_dict()
# create an instance of ContractsGetConsentedContractsRequestQuery from a dict
contracts_get_consented_contracts_request_query_from_dict = ContractsGetConsentedContractsRequestQuery.from_dict(contracts_get_consented_contracts_request_query_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


