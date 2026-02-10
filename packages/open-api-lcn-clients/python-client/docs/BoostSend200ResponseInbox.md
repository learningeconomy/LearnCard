# BoostSend200ResponseInbox

Present when sent via email/phone (Universal Inbox)

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**issuance_id** | **str** |  | 
**status** | **str** |  | 
**claim_url** | **str** | Present when suppressDelivery&#x3D;true | [optional] 

## Example

```python
from openapi_client.models.boost_send200_response_inbox import BoostSend200ResponseInbox

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSend200ResponseInbox from a JSON string
boost_send200_response_inbox_instance = BoostSend200ResponseInbox.from_json(json)
# print the JSON string representation of the object
print(BoostSend200ResponseInbox.to_json())

# convert the object into a dict
boost_send200_response_inbox_dict = boost_send200_response_inbox_instance.to_dict()
# create an instance of BoostSend200ResponseInbox from a dict
boost_send200_response_inbox_from_dict = BoostSend200ResponseInbox.from_dict(boost_send200_response_inbox_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


