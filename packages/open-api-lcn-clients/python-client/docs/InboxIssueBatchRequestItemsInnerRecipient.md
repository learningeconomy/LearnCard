# InboxIssueBatchRequestItemsInnerRecipient

The recipient of the credential

## Properties

| Name      | Type    | Description | Notes |
| --------- | ------- | ----------- | ----- |
| **type**  | **str** |             |
| **value** | **str** |             |

## Example

```python
from openapi_client.models.inbox_issue_batch_request_items_inner_recipient import InboxIssueBatchRequestItemsInnerRecipient

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueBatchRequestItemsInnerRecipient from a JSON string
inbox_issue_batch_request_items_inner_recipient_instance = InboxIssueBatchRequestItemsInnerRecipient.from_json(json)
# print the JSON string representation of the object
print(InboxIssueBatchRequestItemsInnerRecipient.to_json())

# convert the object into a dict
inbox_issue_batch_request_items_inner_recipient_dict = inbox_issue_batch_request_items_inner_recipient_instance.to_dict()
# create an instance of InboxIssueBatchRequestItemsInnerRecipient from a dict
inbox_issue_batch_request_items_inner_recipient_from_dict = InboxIssueBatchRequestItemsInnerRecipient.from_dict(inbox_issue_batch_request_items_inner_recipient_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
