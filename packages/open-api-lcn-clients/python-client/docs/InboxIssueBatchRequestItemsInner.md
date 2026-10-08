# InboxIssueBatchRequestItemsInner

One issuance: provide credential or templateUri. Invalid input is rejected at submission with its item index.

## Properties

| Name                | Type                                                                                                  | Description                                                                                                                            | Notes      |
| ------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **recipient**       | [**InboxIssueBatchRequestItemsInnerRecipient**](InboxIssueBatchRequestItemsInnerRecipient.md)         |                                                                                                                                        |
| **credential**      | [**InboxIssueRequestCredential**](InboxIssueRequestCredential.md)                                     |                                                                                                                                        | [optional] |
| **template_uri**    | **str**                                                                                               | URI of a boost template to use for issuance. The boost credential will be resolved and used. Mutually exclusive with credential field. | [optional] |
| **refresh**         | **bool**                                                                                              | Allocate managed refresh before signing. Requires unsigned content and a registered signing authority; binds the holder on claim.      | [optional] |
| **idempotency_key** | **str**                                                                                               |                                                                                                                                        | [optional] |
| **configuration**   | [**InboxIssueBatchRequestItemsInnerConfiguration**](InboxIssueBatchRequestItemsInnerConfiguration.md) |                                                                                                                                        | [optional] |

## Example

```python
from openapi_client.models.inbox_issue_batch_request_items_inner import InboxIssueBatchRequestItemsInner

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueBatchRequestItemsInner from a JSON string
inbox_issue_batch_request_items_inner_instance = InboxIssueBatchRequestItemsInner.from_json(json)
# print the JSON string representation of the object
print(InboxIssueBatchRequestItemsInner.to_json())

# convert the object into a dict
inbox_issue_batch_request_items_inner_dict = inbox_issue_batch_request_items_inner_instance.to_dict()
# create an instance of InboxIssueBatchRequestItemsInner from a dict
inbox_issue_batch_request_items_inner_from_dict = InboxIssueBatchRequestItemsInner.from_dict(inbox_issue_batch_request_items_inner_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
