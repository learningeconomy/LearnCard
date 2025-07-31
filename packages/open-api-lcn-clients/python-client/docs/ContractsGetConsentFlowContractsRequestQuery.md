# ContractsGetConsentFlowContractsRequestQuery


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**read** | [**ContractsGetConsentFlowContractsRequestQueryRead**](ContractsGetConsentFlowContractsRequestQueryRead.md) |  | [optional] 
**write** | [**ContractsGetConsentFlowContractsRequestQueryWrite**](ContractsGetConsentFlowContractsRequestQueryWrite.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consent_flow_contracts_request_query import ContractsGetConsentFlowContractsRequestQuery

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentFlowContractsRequestQuery from a JSON string
contracts_get_consent_flow_contracts_request_query_instance = ContractsGetConsentFlowContractsRequestQuery.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentFlowContractsRequestQuery.to_json())

# convert the object into a dict
contracts_get_consent_flow_contracts_request_query_dict = contracts_get_consent_flow_contracts_request_query_instance.to_dict()
# create an instance of ContractsGetConsentFlowContractsRequestQuery from a dict
contracts_get_consent_flow_contracts_request_query_from_dict = ContractsGetConsentFlowContractsRequestQuery.from_dict(contracts_get_consent_flow_contracts_request_query_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


