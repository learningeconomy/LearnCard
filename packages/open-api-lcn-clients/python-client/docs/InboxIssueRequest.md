# InboxIssueRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**recipient** | [**InboxIssueRequestRecipient**](InboxIssueRequestRecipient.md) |  | 
**credential** | [**InboxIssueRequestCredential**](InboxIssueRequestCredential.md) |  | 
**configuration** | [**InboxIssueRequestConfiguration**](InboxIssueRequestConfiguration.md) |  | [optional] 

## Example

```python
from openapi_client.models.inbox_issue_request import InboxIssueRequest

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueRequest from a JSON string
inbox_issue_request_instance = InboxIssueRequest.from_json(json)
# print the JSON string representation of the object
print(InboxIssueRequest.to_json())

# convert the object into a dict
inbox_issue_request_dict = inbox_issue_request_instance.to_dict()
# create an instance of InboxIssueRequest from a dict
inbox_issue_request_from_dict = InboxIssueRequest.from_dict(inbox_issue_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


