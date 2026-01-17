# StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOf1VerifiableCredential


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendRequestTemplateCredentialAnyOfContextInner]**](BoostSendRequestTemplateCredentialAnyOfContextInner.md) |  | 
**id** | **str** |  | [optional] 
**type** | **List[str]** |  | 
**issuer** | [**StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuer**](StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuer.md) |  | 
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

## Example

```python
from openapi_client.models.storage_resolve200_response_any_of_any_of_any_of_any_of1_verifiable_credential import StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOf1VerifiableCredential

# TODO update the JSON string below
json = "{}"
# create an instance of StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOf1VerifiableCredential from a JSON string
storage_resolve200_response_any_of_any_of_any_of_any_of1_verifiable_credential_instance = StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOf1VerifiableCredential.from_json(json)
# print the JSON string representation of the object
print(StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOf1VerifiableCredential.to_json())

# convert the object into a dict
storage_resolve200_response_any_of_any_of_any_of_any_of1_verifiable_credential_dict = storage_resolve200_response_any_of_any_of_any_of_any_of1_verifiable_credential_instance.to_dict()
# create an instance of StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOf1VerifiableCredential from a dict
storage_resolve200_response_any_of_any_of_any_of_any_of1_verifiable_credential_from_dict = StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOf1VerifiableCredential.from_dict(storage_resolve200_response_any_of_any_of_any_of_any_of1_verifiable_credential_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


