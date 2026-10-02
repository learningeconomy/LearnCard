# InboxGetBatch200Response

## Properties

| Name           | Type                                                                                  | Description                                                                     | Notes |
| -------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----- |
| **batch_id**   | **str**                                                                               |                                                                                 |
| **created_at** | **str**                                                                               |                                                                                 |
| **done**       | **bool**                                                                              | True when no queued or processing items remain, including unconfirmed outcomes. |
| **status**     | **str**                                                                               |                                                                                 |
| **items**      | [**List[InboxGetBatch200ResponseItemsInner]**](InboxGetBatch200ResponseItemsInner.md) |                                                                                 |
| **summary**    | [**InboxGetBatch200ResponseSummary**](InboxGetBatch200ResponseSummary.md)             |                                                                                 |

## Example

```python
from openapi_client.models.inbox_get_batch200_response import InboxGetBatch200Response

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetBatch200Response from a JSON string
inbox_get_batch200_response_instance = InboxGetBatch200Response.from_json(json)
# print the JSON string representation of the object
print(InboxGetBatch200Response.to_json())

# convert the object into a dict
inbox_get_batch200_response_dict = inbox_get_batch200_response_instance.to_dict()
# create an instance of InboxGetBatch200Response from a dict
inbox_get_batch200_response_from_dict = InboxGetBatch200Response.from_dict(inbox_get_batch200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
