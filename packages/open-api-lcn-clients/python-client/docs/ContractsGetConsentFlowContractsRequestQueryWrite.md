# ContractsGetConsentFlowContractsRequestQueryWrite


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**credentials** | [**ContractsGetConsentFlowContractsRequestQueryReadCredentials**](ContractsGetConsentFlowContractsRequestQueryReadCredentials.md) |  | [optional] 
**personal** | [**Dict[str, ContractsGetConsentFlowContractsRequestQueryReadCredentialsCategoriesValue]**](ContractsGetConsentFlowContractsRequestQueryReadCredentialsCategoriesValue.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consent_flow_contracts_request_query_write import ContractsGetConsentFlowContractsRequestQueryWrite

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentFlowContractsRequestQueryWrite from a JSON string
contracts_get_consent_flow_contracts_request_query_write_instance = ContractsGetConsentFlowContractsRequestQueryWrite.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentFlowContractsRequestQueryWrite.to_json())

# convert the object into a dict
contracts_get_consent_flow_contracts_request_query_write_dict = contracts_get_consent_flow_contracts_request_query_write_instance.to_dict()
# create an instance of ContractsGetConsentFlowContractsRequestQueryWrite from a dict
contracts_get_consent_flow_contracts_request_query_write_from_dict = ContractsGetConsentFlowContractsRequestQueryWrite.from_dict(contracts_get_consent_flow_contracts_request_query_write_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


