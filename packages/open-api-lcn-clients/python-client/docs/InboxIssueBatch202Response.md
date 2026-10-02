# InboxIssueBatch202Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**batch_id** | **str** |  | 
**status** | **str** |  | 
**created_at** | **str** |  | 

## Example

```python
from openapi_client.models.inbox_issue_batch202_response import InboxIssueBatch202Response

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueBatch202Response from a JSON string
inbox_issue_batch202_response_instance = InboxIssueBatch202Response.from_json(json)
# print the JSON string representation of the object
print(InboxIssueBatch202Response.to_json())

# convert the object into a dict
inbox_issue_batch202_response_dict = inbox_issue_batch202_response_instance.to_dict()
# create an instance of InboxIssueBatch202Response from a dict
inbox_issue_batch202_response_from_dict = InboxIssueBatch202Response.from_dict(inbox_issue_batch202_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


