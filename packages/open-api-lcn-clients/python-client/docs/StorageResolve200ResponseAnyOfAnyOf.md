# StorageResolve200ResponseAnyOfAnyOf


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendRequestTemplateCredentialAnyOfContextInner]**](BoostSendRequestTemplateCredentialAnyOfContextInner.md) |  | 
**id** | **str** |  | [optional] 
**type** | [**BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType**](BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType.md) |  | 
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
**verifiable_credential** | [**StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOf1VerifiableCredential**](StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOf1VerifiableCredential.md) |  | [optional] 
**holder** | **str** |  | [optional] 
**protected** | **str** |  | 
**iv** | **str** |  | 
**ciphertext** | **str** |  | 
**tag** | **str** |  | 
**aad** | **str** |  | [optional] 
**recipients** | [**List[StorageResolve200ResponseAnyOfAnyOfAnyOf1RecipientsInner]**](StorageResolve200ResponseAnyOfAnyOfAnyOf1RecipientsInner.md) |  | [optional] 

## Example

```python
from openapi_client.models.storage_resolve200_response_any_of_any_of import StorageResolve200ResponseAnyOfAnyOf

# TODO update the JSON string below
json = "{}"
# create an instance of StorageResolve200ResponseAnyOfAnyOf from a JSON string
storage_resolve200_response_any_of_any_of_instance = StorageResolve200ResponseAnyOfAnyOf.from_json(json)
# print the JSON string representation of the object
print(StorageResolve200ResponseAnyOfAnyOf.to_json())

# convert the object into a dict
storage_resolve200_response_any_of_any_of_dict = storage_resolve200_response_any_of_any_of_instance.to_dict()
# create an instance of StorageResolve200ResponseAnyOfAnyOf from a dict
storage_resolve200_response_any_of_any_of_from_dict = StorageResolve200ResponseAnyOfAnyOf.from_dict(storage_resolve200_response_any_of_any_of_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


