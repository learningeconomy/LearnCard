# WorkflowsParticipateInExchangeRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**verifiable_presentation** | [**PresentationSendPresentationRequestPresentationAnyOf**](PresentationSendPresentationRequestPresentationAnyOf.md) |  | [optional] 

## Example

```python
from openapi_client.models.workflows_participate_in_exchange_request import WorkflowsParticipateInExchangeRequest

# TODO update the JSON string below
json = "{}"
# create an instance of WorkflowsParticipateInExchangeRequest from a JSON string
workflows_participate_in_exchange_request_instance = WorkflowsParticipateInExchangeRequest.from_json(json)
# print the JSON string representation of the object
print(WorkflowsParticipateInExchangeRequest.to_json())

# convert the object into a dict
workflows_participate_in_exchange_request_dict = workflows_participate_in_exchange_request_instance.to_dict()
# create an instance of WorkflowsParticipateInExchangeRequest from a dict
workflows_participate_in_exchange_request_from_dict = WorkflowsParticipateInExchangeRequest.from_dict(workflows_participate_in_exchange_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


