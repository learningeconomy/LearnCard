# InboxIssueBatchRequest

## Properties

| Name              | Type                                                                              | Description | Notes      |
| ----------------- | --------------------------------------------------------------------------------- | ----------- | ---------- |
| **request_id**    | **str**                                                                           |             | [optional] |
| **items**         | [**List[InboxIssueBatchRequestItemsInner]**](InboxIssueBatchRequestItemsInner.md) |             |
| **configuration** | [**InboxIssueBatchRequestConfiguration**](InboxIssueBatchRequestConfiguration.md) |             | [optional] |

## Example

```python
from openapi_client.models.inbox_issue_batch_request import InboxIssueBatchRequest

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueBatchRequest from a JSON string
inbox_issue_batch_request_instance = InboxIssueBatchRequest.from_json(json)
# print the JSON string representation of the object
print(InboxIssueBatchRequest.to_json())

# convert the object into a dict
inbox_issue_batch_request_dict = inbox_issue_batch_request_instance.to_dict()
# create an instance of InboxIssueBatchRequest from a dict
inbox_issue_batch_request_from_dict = InboxIssueBatchRequest.from_dict(inbox_issue_batch_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
