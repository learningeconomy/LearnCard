# ContractsWriteCredentialToContractRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**did** | **str** |  | 
**contract_uri** | **str** |  | 
**boost_uri** | **str** |  | 
**credential** | [**BoostSendBoostRequestCredential**](BoostSendBoostRequestCredential.md) |  | 

## Example

```python
from openapi_client.models.contracts_write_credential_to_contract_request import ContractsWriteCredentialToContractRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsWriteCredentialToContractRequest from a JSON string
contracts_write_credential_to_contract_request_instance = ContractsWriteCredentialToContractRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsWriteCredentialToContractRequest.to_json())

# convert the object into a dict
contracts_write_credential_to_contract_request_dict = contracts_write_credential_to_contract_request_instance.to_dict()
# create an instance of ContractsWriteCredentialToContractRequest from a dict
contracts_write_credential_to_contract_request_from_dict = ContractsWriteCredentialToContractRequest.from_dict(contracts_write_credential_to_contract_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


