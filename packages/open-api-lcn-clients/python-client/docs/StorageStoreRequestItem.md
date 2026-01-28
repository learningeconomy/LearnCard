# StorageStoreRequestItem


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendRequestTemplateCredentialAnyOfContextInner]**](BoostSendRequestTemplateCredentialAnyOfContextInner.md) |  | 
**id** | **str** |  | [optional] 
**type** | [**BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType**](BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType.md) |  | 
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
**verifiable_credential** | [**PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential**](PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential.md) |  | [optional] 
**holder** | **str** |  | [optional] 
**protected** | **str** |  | 
**iv** | **str** |  | 
**ciphertext** | **str** |  | 
**tag** | **str** |  | 
**aad** | **str** |  | [optional] 
**recipients** | [**List[CredentialSendCredentialRequestCredentialAnyOf1RecipientsInner]**](CredentialSendCredentialRequestCredentialAnyOf1RecipientsInner.md) |  | [optional] 

## Example

```python
from openapi_client.models.storage_store_request_item import StorageStoreRequestItem

# TODO update the JSON string below
json = "{}"
# create an instance of StorageStoreRequestItem from a JSON string
storage_store_request_item_instance = StorageStoreRequestItem.from_json(json)
# print the JSON string representation of the object
print(StorageStoreRequestItem.to_json())

# convert the object into a dict
storage_store_request_item_dict = storage_store_request_item_instance.to_dict()
# create an instance of StorageStoreRequestItem from a dict
storage_store_request_item_from_dict = StorageStoreRequestItem.from_dict(storage_store_request_item_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


