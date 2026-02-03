# StorageResolve200ResponseAnyOf


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
**read** | [**StorageResolve200ResponseAnyOfAnyOf1Read**](StorageResolve200ResponseAnyOfAnyOf1Read.md) |  | 
**write** | [**StorageResolve200ResponseAnyOfAnyOf1Write**](StorageResolve200ResponseAnyOfAnyOf1Write.md) |  | 

## Example

```python
from openapi_client.models.storage_resolve200_response_any_of import StorageResolve200ResponseAnyOf

# TODO update the JSON string below
json = "{}"
# create an instance of StorageResolve200ResponseAnyOf from a JSON string
storage_resolve200_response_any_of_instance = StorageResolve200ResponseAnyOf.from_json(json)
# print the JSON string representation of the object
print(StorageResolve200ResponseAnyOf.to_json())

# convert the object into a dict
storage_resolve200_response_any_of_dict = storage_resolve200_response_any_of_instance.to_dict()
# create an instance of StorageResolve200ResponseAnyOf from a dict
storage_resolve200_response_any_of_from_dict = StorageResolve200ResponseAnyOf.from_dict(storage_resolve200_response_any_of_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


