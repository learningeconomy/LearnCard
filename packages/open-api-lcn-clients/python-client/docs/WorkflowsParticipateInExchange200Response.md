# WorkflowsParticipateInExchange200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**verifiable_presentation** | [**PresentationSendPresentationRequestPresentationAnyOf**](PresentationSendPresentationRequestPresentationAnyOf.md) |  | [optional] 
**verifiable_presentation_request** | [**WorkflowsParticipateInExchange200ResponseVerifiablePresentationRequest**](WorkflowsParticipateInExchange200ResponseVerifiablePresentationRequest.md) |  | [optional] 
**redirect_url** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.workflows_participate_in_exchange200_response import WorkflowsParticipateInExchange200Response

# TODO update the JSON string below
json = "{}"
# create an instance of WorkflowsParticipateInExchange200Response from a JSON string
workflows_participate_in_exchange200_response_instance = WorkflowsParticipateInExchange200Response.from_json(json)
# print the JSON string representation of the object
print(WorkflowsParticipateInExchange200Response.to_json())

# convert the object into a dict
workflows_participate_in_exchange200_response_dict = workflows_participate_in_exchange200_response_instance.to_dict()
# create an instance of WorkflowsParticipateInExchange200Response from a dict
workflows_participate_in_exchange200_response_from_dict = WorkflowsParticipateInExchange200Response.from_dict(workflows_participate_in_exchange200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


