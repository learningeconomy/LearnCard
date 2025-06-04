# ContractsGetConsentedContractsRequestQueryRead


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**anonymize** | **bool** |  | [optional] 
**credentials** | [**ContractsGetConsentedContractsRequestQueryReadCredentials**](ContractsGetConsentedContractsRequestQueryReadCredentials.md) |  | [optional] 
**personal** | **Dict[str, str]** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consented_contracts_request_query_read import ContractsGetConsentedContractsRequestQueryRead

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedContractsRequestQueryRead from a JSON string
contracts_get_consented_contracts_request_query_read_instance = ContractsGetConsentedContractsRequestQueryRead.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedContractsRequestQueryRead.to_json())

# convert the object into a dict
contracts_get_consented_contracts_request_query_read_dict = contracts_get_consented_contracts_request_query_read_instance.to_dict()
# create an instance of ContractsGetConsentedContractsRequestQueryRead from a dict
contracts_get_consented_contracts_request_query_read_from_dict = ContractsGetConsentedContractsRequestQueryRead.from_dict(contracts_get_consented_contracts_request_query_read_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


