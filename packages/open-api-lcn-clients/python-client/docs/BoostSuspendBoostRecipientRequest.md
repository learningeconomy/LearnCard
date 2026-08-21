# BoostSuspendBoostRecipientRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**boost_uri** | **str** |  | 
**recipient_profile_id** | **str** |  | 
**credential_uri** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.boost_suspend_boost_recipient_request import BoostSuspendBoostRecipientRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSuspendBoostRecipientRequest from a JSON string
boost_suspend_boost_recipient_request_instance = BoostSuspendBoostRecipientRequest.from_json(json)
# print the JSON string representation of the object
print(BoostSuspendBoostRecipientRequest.to_json())

# convert the object into a dict
boost_suspend_boost_recipient_request_dict = boost_suspend_boost_recipient_request_instance.to_dict()
# create an instance of BoostSuspendBoostRecipientRequest from a dict
boost_suspend_boost_recipient_request_from_dict = BoostSuspendBoostRecipientRequest.from_dict(boost_suspend_boost_recipient_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


