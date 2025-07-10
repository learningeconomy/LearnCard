# InboxIssue200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**issuance_id** | **str** |  | 
**status** | **str** |  | 
**recipient** | [**InboxIssue200ResponseRecipient**](InboxIssue200ResponseRecipient.md) |  | 
**claim_url** | **str** |  | [optional] 
**recipient_did** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.inbox_issue200_response import InboxIssue200Response

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssue200Response from a JSON string
inbox_issue200_response_instance = InboxIssue200Response.from_json(json)
# print the JSON string representation of the object
print(InboxIssue200Response.to_json())

# convert the object into a dict
inbox_issue200_response_dict = inbox_issue200_response_instance.to_dict()
# create an instance of InboxIssue200Response from a dict
inbox_issue200_response_from_dict = InboxIssue200Response.from_dict(inbox_issue200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


