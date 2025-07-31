# ContractsGetCredentialsForContractRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**terms_uri** | **str** |  | 
**include_received** | **bool** |  | [optional] [default to True]

## Example

```python
from openapi_client.models.contracts_get_credentials_for_contract_request import ContractsGetCredentialsForContractRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetCredentialsForContractRequest from a JSON string
contracts_get_credentials_for_contract_request_instance = ContractsGetCredentialsForContractRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsGetCredentialsForContractRequest.to_json())

# convert the object into a dict
contracts_get_credentials_for_contract_request_dict = contracts_get_credentials_for_contract_request_instance.to_dict()
# create an instance of ContractsGetCredentialsForContractRequest from a dict
contracts_get_credentials_for_contract_request_from_dict = ContractsGetCredentialsForContractRequest.from_dict(contracts_get_credentials_for_contract_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


