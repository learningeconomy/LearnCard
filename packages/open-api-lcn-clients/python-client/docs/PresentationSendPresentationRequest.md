# PresentationSendPresentationRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**presentation** | [**PresentationSendPresentationRequestPresentation**](PresentationSendPresentationRequestPresentation.md) |  | 

## Example

```python
from openapi_client.models.presentation_send_presentation_request import PresentationSendPresentationRequest

# TODO update the JSON string below
json = "{}"
# create an instance of PresentationSendPresentationRequest from a JSON string
presentation_send_presentation_request_instance = PresentationSendPresentationRequest.from_json(json)
# print the JSON string representation of the object
print(PresentationSendPresentationRequest.to_json())

# convert the object into a dict
presentation_send_presentation_request_dict = presentation_send_presentation_request_instance.to_dict()
# create an instance of PresentationSendPresentationRequest from a dict
presentation_send_presentation_request_from_dict = PresentationSendPresentationRequest.from_dict(presentation_send_presentation_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


