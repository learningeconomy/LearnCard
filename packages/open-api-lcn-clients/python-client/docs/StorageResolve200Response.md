# StorageResolve200Response


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
**read** | [**StorageResolve200ResponseAnyOf1Read**](StorageResolve200ResponseAnyOf1Read.md) |  | 
**write** | [**StorageResolve200ResponseAnyOf1Write**](StorageResolve200ResponseAnyOf1Write.md) |  | 
**denied_writers** | **List[str]** |  | [optional] 

## Example

```python
from openapi_client.models.storage_resolve200_response import StorageResolve200Response

# TODO update the JSON string below
json = "{}"
# create an instance of StorageResolve200Response from a JSON string
storage_resolve200_response_instance = StorageResolve200Response.from_json(json)
# print the JSON string representation of the object
print(StorageResolve200Response.to_json())

# convert the object into a dict
storage_resolve200_response_dict = storage_resolve200_response_instance.to_dict()
# create an instance of StorageResolve200Response from a dict
storage_resolve200_response_from_dict = StorageResolve200Response.from_dict(storage_resolve200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


