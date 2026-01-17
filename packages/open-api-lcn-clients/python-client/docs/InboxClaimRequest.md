# InboxClaimRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**credential** | [**InboxClaimRequestCredential**](InboxClaimRequestCredential.md) |  | 
**configuration** | [**InboxClaimRequestConfiguration**](InboxClaimRequestConfiguration.md) |  | [optional] 

## Example

```python
from openapi_client.models.inbox_claim_request import InboxClaimRequest

# TODO update the JSON string below
json = "{}"
# create an instance of InboxClaimRequest from a JSON string
inbox_claim_request_instance = InboxClaimRequest.from_json(json)
# print the JSON string representation of the object
print(InboxClaimRequest.to_json())

# convert the object into a dict
inbox_claim_request_dict = inbox_claim_request_instance.to_dict()
# create an instance of InboxClaimRequest from a dict
inbox_claim_request_from_dict = InboxClaimRequest.from_dict(inbox_claim_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


