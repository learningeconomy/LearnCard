# ContractsWriteCredentialToContractRequestCredential


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendRequestTemplateCredentialAnyOfContextInner]**](BoostSendRequestTemplateCredentialAnyOfContextInner.md) |  | 
**id** | **str** |  | [optional] 
**type** | **List[str]** |  | 
**issuer** | [**BoostSendRequestTemplateCredentialAnyOfIssuer**](BoostSendRequestTemplateCredentialAnyOfIssuer.md) |  | 
**credential_subject** | [**BoostSendRequestTemplateCredentialAnyOfCredentialSubject**](BoostSendRequestTemplateCredentialAnyOfCredentialSubject.md) |  | 
**refresh_service** | [**BoostSendBoostRequestCredentialAnyOfTermsOfUse**](BoostSendBoostRequestCredentialAnyOfTermsOfUse.md) |  | [optional] 
**credential_schema** | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md) |  | [optional] 
**issuance_date** | **str** |  | [optional] 
**expiration_date** | **str** |  | [optional] 
**credential_status** | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md) |  | [optional] 
**name** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**valid_from** | **str** |  | [optional] 
**valid_until** | **str** |  | [optional] 
**status** | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md) |  | [optional] 
**terms_of_use** | [**BoostSendBoostRequestCredentialAnyOfTermsOfUse**](BoostSendBoostRequestCredentialAnyOfTermsOfUse.md) |  | [optional] 
**evidence** | [**BoostSendRequestTemplateCredentialAnyOfEvidence**](BoostSendRequestTemplateCredentialAnyOfEvidence.md) |  | [optional] 
**proof** | [**BoostSendRequestTemplateCredentialAnyOfProof**](BoostSendRequestTemplateCredentialAnyOfProof.md) |  | 
**protected** | **str** |  | 
**iv** | **str** |  | 
**ciphertext** | **str** |  | 
**tag** | **str** |  | 
**aad** | **str** |  | [optional] 
**recipients** | [**List[CredentialSendCredentialRequestCredentialAnyOf1RecipientsInner]**](CredentialSendCredentialRequestCredentialAnyOf1RecipientsInner.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_write_credential_to_contract_request_credential import ContractsWriteCredentialToContractRequestCredential

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsWriteCredentialToContractRequestCredential from a JSON string
contracts_write_credential_to_contract_request_credential_instance = ContractsWriteCredentialToContractRequestCredential.from_json(json)
# print the JSON string representation of the object
print(ContractsWriteCredentialToContractRequestCredential.to_json())

# convert the object into a dict
contracts_write_credential_to_contract_request_credential_dict = contracts_write_credential_to_contract_request_credential_instance.to_dict()
# create an instance of ContractsWriteCredentialToContractRequestCredential from a dict
contracts_write_credential_to_contract_request_credential_from_dict = ContractsWriteCredentialToContractRequestCredential.from_dict(contracts_write_credential_to_contract_request_credential_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


