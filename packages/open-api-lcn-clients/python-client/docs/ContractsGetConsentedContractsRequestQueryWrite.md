# ContractsGetConsentedContractsRequestQueryWrite


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**credentials** | [**ContractsGetConsentedDataForContractRequestQueryCredentials**](ContractsGetConsentedDataForContractRequestQueryCredentials.md) |  | [optional] 
**personal** | **Dict[str, bool]** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consented_contracts_request_query_write import ContractsGetConsentedContractsRequestQueryWrite

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedContractsRequestQueryWrite from a JSON string
contracts_get_consented_contracts_request_query_write_instance = ContractsGetConsentedContractsRequestQueryWrite.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedContractsRequestQueryWrite.to_json())

# convert the object into a dict
contracts_get_consented_contracts_request_query_write_dict = contracts_get_consented_contracts_request_query_write_instance.to_dict()
# create an instance of ContractsGetConsentedContractsRequestQueryWrite from a dict
contracts_get_consented_contracts_request_query_write_from_dict = ContractsGetConsentedContractsRequestQueryWrite.from_dict(contracts_get_consented_contracts_request_query_write_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


