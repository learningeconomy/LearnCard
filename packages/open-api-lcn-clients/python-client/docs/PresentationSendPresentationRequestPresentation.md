# PresentationSendPresentationRequestPresentation


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendBoostRequestCredentialAnyOfContextInner]**](BoostSendBoostRequestCredentialAnyOfContextInner.md) |  | 
**id** | **str** |  | [optional] 
**type** | [**BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType**](BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType.md) |  | 
**verifiable_credential** | [**PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential**](PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential.md) |  | [optional] 
**holder** | **str** |  | [optional] 
**proof** | [**BoostSendBoostRequestCredentialAnyOfProof**](BoostSendBoostRequestCredentialAnyOfProof.md) |  | 
**protected** | **str** |  | 
**iv** | **str** |  | 
**ciphertext** | **str** |  | 
**tag** | **str** |  | 
**aad** | **str** |  | [optional] 
**recipients** | [**List[BoostSendBoostRequestCredentialAnyOf1RecipientsInner]**](BoostSendBoostRequestCredentialAnyOf1RecipientsInner.md) |  | [optional] 

## Example

```python
from openapi_client.models.presentation_send_presentation_request_presentation import PresentationSendPresentationRequestPresentation

# TODO update the JSON string below
json = "{}"
# create an instance of PresentationSendPresentationRequestPresentation from a JSON string
presentation_send_presentation_request_presentation_instance = PresentationSendPresentationRequestPresentation.from_json(json)
# print the JSON string representation of the object
print(PresentationSendPresentationRequestPresentation.to_json())

# convert the object into a dict
presentation_send_presentation_request_presentation_dict = presentation_send_presentation_request_presentation_instance.to_dict()
# create an instance of PresentationSendPresentationRequestPresentation from a dict
presentation_send_presentation_request_presentation_from_dict = PresentationSendPresentationRequestPresentation.from_dict(presentation_send_presentation_request_presentation_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


