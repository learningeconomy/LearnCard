# PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendBoostRequestCredentialAnyOfContextInner]**](BoostSendBoostRequestCredentialAnyOfContextInner.md) |  | 
**id** | **str** |  | [optional] 
**type** | **List[str]** |  | 
**issuer** | [**BoostSendBoostRequestCredentialAnyOfIssuer**](BoostSendBoostRequestCredentialAnyOfIssuer.md) |  | 
**credential_subject** | [**BoostSendBoostRequestCredentialAnyOfCredentialSubject**](BoostSendBoostRequestCredentialAnyOfCredentialSubject.md) |  | 
**refresh_service** | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md) |  | [optional] 
**credential_schema** | [**BoostSendBoostRequestCredentialAnyOfCredentialSchema**](BoostSendBoostRequestCredentialAnyOfCredentialSchema.md) |  | [optional] 
**issuance_date** | **str** |  | [optional] 
**expiration_date** | **str** |  | [optional] 
**credential_status** | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md) |  | [optional] 
**name** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**valid_from** | **str** |  | [optional] 
**valid_until** | **str** |  | [optional] 
**status** | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md) |  | [optional] 
**terms_of_use** | [**BoostSendBoostRequestCredentialAnyOfTermsOfUse**](BoostSendBoostRequestCredentialAnyOfTermsOfUse.md) |  | [optional] 
**evidence** | [**BoostSendBoostRequestCredentialAnyOfEvidence**](BoostSendBoostRequestCredentialAnyOfEvidence.md) |  | [optional] 
**proof** | [**BoostSendBoostRequestCredentialAnyOfProof**](BoostSendBoostRequestCredentialAnyOfProof.md) |  | 

## Example

```python
from openapi_client.models.presentation_send_presentation_request_presentation_any_of_verifiable_credential import PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential

# TODO update the JSON string below
json = "{}"
# create an instance of PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential from a JSON string
presentation_send_presentation_request_presentation_any_of_verifiable_credential_instance = PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential.from_json(json)
# print the JSON string representation of the object
print(PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential.to_json())

# convert the object into a dict
presentation_send_presentation_request_presentation_any_of_verifiable_credential_dict = presentation_send_presentation_request_presentation_any_of_verifiable_credential_instance.to_dict()
# create an instance of PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential from a dict
presentation_send_presentation_request_presentation_any_of_verifiable_credential_from_dict = PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential.from_dict(presentation_send_presentation_request_presentation_any_of_verifiable_credential_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


