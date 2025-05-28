# ContractsGetConsentFlowContractsRequestQueryRead


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**anonymize** | **bool** |  | [optional] 
**credentials** | [**ContractsGetConsentFlowContractsRequestQueryReadCredentials**](ContractsGetConsentFlowContractsRequestQueryReadCredentials.md) |  | [optional] 
**personal** | [**Dict[str, ContractsGetConsentFlowContractsRequestQueryReadCredentialsCategoriesValue]**](ContractsGetConsentFlowContractsRequestQueryReadCredentialsCategoriesValue.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consent_flow_contracts_request_query_read import ContractsGetConsentFlowContractsRequestQueryRead

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentFlowContractsRequestQueryRead from a JSON string
contracts_get_consent_flow_contracts_request_query_read_instance = ContractsGetConsentFlowContractsRequestQueryRead.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentFlowContractsRequestQueryRead.to_json())

# convert the object into a dict
contracts_get_consent_flow_contracts_request_query_read_dict = contracts_get_consent_flow_contracts_request_query_read_instance.to_dict()
# create an instance of ContractsGetConsentFlowContractsRequestQueryRead from a dict
contracts_get_consent_flow_contracts_request_query_read_from_dict = ContractsGetConsentFlowContractsRequestQueryRead.from_dict(contracts_get_consent_flow_contracts_request_query_read_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


