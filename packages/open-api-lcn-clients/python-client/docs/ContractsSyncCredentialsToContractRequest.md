# ContractsSyncCredentialsToContractRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**terms_uri** | **str** |  | 
**categories** | **Dict[str, List[str]]** |  | 

## Example

```python
from openapi_client.models.contracts_sync_credentials_to_contract_request import ContractsSyncCredentialsToContractRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsSyncCredentialsToContractRequest from a JSON string
contracts_sync_credentials_to_contract_request_instance = ContractsSyncCredentialsToContractRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsSyncCredentialsToContractRequest.to_json())

# convert the object into a dict
contracts_sync_credentials_to_contract_request_dict = contracts_sync_credentials_to_contract_request_instance.to_dict()
# create an instance of ContractsSyncCredentialsToContractRequest from a dict
contracts_sync_credentials_to_contract_request_from_dict = ContractsSyncCredentialsToContractRequest.from_dict(contracts_sync_credentials_to_contract_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


