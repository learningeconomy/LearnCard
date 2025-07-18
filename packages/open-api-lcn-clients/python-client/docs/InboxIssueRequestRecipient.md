# InboxIssueRequestRecipient

The recipient of the credential

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **str** |  | 
**value** | **str** |  | 

## Example

```python
from openapi_client.models.inbox_issue_request_recipient import InboxIssueRequestRecipient

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueRequestRecipient from a JSON string
inbox_issue_request_recipient_instance = InboxIssueRequestRecipient.from_json(json)
# print the JSON string representation of the object
print(InboxIssueRequestRecipient.to_json())

# convert the object into a dict
inbox_issue_request_recipient_dict = inbox_issue_request_recipient_instance.to_dict()
# create an instance of InboxIssueRequestRecipient from a dict
inbox_issue_request_recipient_from_dict = InboxIssueRequestRecipient.from_dict(inbox_issue_request_recipient_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


