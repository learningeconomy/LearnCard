# InboxClaim200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**inbox_credential** | [**InboxClaim200ResponseInboxCredential**](InboxClaim200ResponseInboxCredential.md) |  | 
**status** | **str** |  | 
**recipient_did** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.inbox_claim200_response import InboxClaim200Response

# TODO update the JSON string below
json = "{}"
# create an instance of InboxClaim200Response from a JSON string
inbox_claim200_response_instance = InboxClaim200Response.from_json(json)
# print the JSON string representation of the object
print(InboxClaim200Response.to_json())

# convert the object into a dict
inbox_claim200_response_dict = inbox_claim200_response_instance.to_dict()
# create an instance of InboxClaim200Response from a dict
inbox_claim200_response_from_dict = InboxClaim200Response.from_dict(inbox_claim200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


