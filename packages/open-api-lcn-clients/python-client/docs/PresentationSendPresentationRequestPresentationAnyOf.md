# PresentationSendPresentationRequestPresentationAnyOf


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendBoostRequestCredentialAnyOfContextInner]**](BoostSendBoostRequestCredentialAnyOfContextInner.md) |  | 
**id** | **str** |  | [optional] 
**type** | [**BoostSendBoostRequestCredentialAnyOfEvidenceAnyOfType**](BoostSendBoostRequestCredentialAnyOfEvidenceAnyOfType.md) |  | 
**verifiable_credential** | [**PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential**](PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential.md) |  | [optional] 
**holder** | **str** |  | [optional] 
**proof** | [**BoostSendBoostRequestCredentialAnyOfProof**](BoostSendBoostRequestCredentialAnyOfProof.md) |  | 

## Example

```python
from openapi_client.models.presentation_send_presentation_request_presentation_any_of import PresentationSendPresentationRequestPresentationAnyOf

# TODO update the JSON string below
json = "{}"
# create an instance of PresentationSendPresentationRequestPresentationAnyOf from a JSON string
presentation_send_presentation_request_presentation_any_of_instance = PresentationSendPresentationRequestPresentationAnyOf.from_json(json)
# print the JSON string representation of the object
print(PresentationSendPresentationRequestPresentationAnyOf.to_json())

# convert the object into a dict
presentation_send_presentation_request_presentation_any_of_dict = presentation_send_presentation_request_presentation_any_of_instance.to_dict()
# create an instance of PresentationSendPresentationRequestPresentationAnyOf from a dict
presentation_send_presentation_request_presentation_any_of_from_dict = PresentationSendPresentationRequestPresentationAnyOf.from_dict(presentation_send_presentation_request_presentation_any_of_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


