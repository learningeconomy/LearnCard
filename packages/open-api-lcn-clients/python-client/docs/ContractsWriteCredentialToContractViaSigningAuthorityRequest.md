# ContractsWriteCredentialToContractViaSigningAuthorityRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**did** | **str** |  | 
**contract_uri** | **str** |  | 
**boost_uri** | **str** |  | 
**signing_authority** | [**BoostSendBoostViaSigningAuthorityRequestSigningAuthority**](BoostSendBoostViaSigningAuthorityRequestSigningAuthority.md) |  | 

## Example

```python
from openapi_client.models.contracts_write_credential_to_contract_via_signing_authority_request import ContractsWriteCredentialToContractViaSigningAuthorityRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsWriteCredentialToContractViaSigningAuthorityRequest from a JSON string
contracts_write_credential_to_contract_via_signing_authority_request_instance = ContractsWriteCredentialToContractViaSigningAuthorityRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsWriteCredentialToContractViaSigningAuthorityRequest.to_json())

# convert the object into a dict
contracts_write_credential_to_contract_via_signing_authority_request_dict = contracts_write_credential_to_contract_via_signing_authority_request_instance.to_dict()
# create an instance of ContractsWriteCredentialToContractViaSigningAuthorityRequest from a dict
contracts_write_credential_to_contract_via_signing_authority_request_from_dict = ContractsWriteCredentialToContractViaSigningAuthorityRequest.from_dict(contracts_write_credential_to_contract_via_signing_authority_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


