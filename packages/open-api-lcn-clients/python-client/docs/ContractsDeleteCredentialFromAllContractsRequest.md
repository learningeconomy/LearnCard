# ContractsDeleteCredentialFromAllContractsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**deleted_uris** | **List[str]** |  | 

## Example

```python
from openapi_client.models.contracts_delete_credential_from_all_contracts_request import ContractsDeleteCredentialFromAllContractsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsDeleteCredentialFromAllContractsRequest from a JSON string
contracts_delete_credential_from_all_contracts_request_instance = ContractsDeleteCredentialFromAllContractsRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsDeleteCredentialFromAllContractsRequest.to_json())

# convert the object into a dict
contracts_delete_credential_from_all_contracts_request_dict = contracts_delete_credential_from_all_contracts_request_instance.to_dict()
# create an instance of ContractsDeleteCredentialFromAllContractsRequest from a dict
contracts_delete_credential_from_all_contracts_request_from_dict = ContractsDeleteCredentialFromAllContractsRequest.from_dict(contracts_delete_credential_from_all_contracts_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


