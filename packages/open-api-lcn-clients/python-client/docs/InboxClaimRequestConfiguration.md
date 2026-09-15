# InboxClaimRequestConfiguration


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**publishable_key** | **str** |  | 
**signing_authority_name** | **str** |  | [optional] 
**listing_id** | **str** |  | [optional] 
**listing_slug** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.inbox_claim_request_configuration import InboxClaimRequestConfiguration

# TODO update the JSON string below
json = "{}"
# create an instance of InboxClaimRequestConfiguration from a JSON string
inbox_claim_request_configuration_instance = InboxClaimRequestConfiguration.from_json(json)
# print the JSON string representation of the object
print(InboxClaimRequestConfiguration.to_json())

# convert the object into a dict
inbox_claim_request_configuration_dict = inbox_claim_request_configuration_instance.to_dict()
# create an instance of InboxClaimRequestConfiguration from a dict
inbox_claim_request_configuration_from_dict = InboxClaimRequestConfiguration.from_dict(inbox_claim_request_configuration_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


