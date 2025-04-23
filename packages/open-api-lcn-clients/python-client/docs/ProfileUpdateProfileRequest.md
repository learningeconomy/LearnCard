# ProfileUpdateProfileRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile_id** | **str** |  | [optional] 
**display_name** | **str** |  | [optional] [default to '']
**short_bio** | **str** |  | [optional] [default to '']
**bio** | **str** |  | [optional] [default to '']
**is_private** | **bool** |  | [optional] 
**email** | **str** |  | [optional] 
**image** | **str** |  | [optional] 
**hero_image** | **str** |  | [optional] 
**website_link** | **str** |  | [optional] 
**type** | **str** |  | [optional] 
**notifications_webhook** | **str** |  | [optional] 
**display** | [**BoostGetBoostRecipients200ResponseInnerToDisplay**](BoostGetBoostRecipients200ResponseInnerToDisplay.md) |  | [optional] 

## Example

```python
from openapi_client.models.profile_update_profile_request import ProfileUpdateProfileRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileUpdateProfileRequest from a JSON string
profile_update_profile_request_instance = ProfileUpdateProfileRequest.from_json(json)
# print the JSON string representation of the object
print(ProfileUpdateProfileRequest.to_json())

# convert the object into a dict
profile_update_profile_request_dict = profile_update_profile_request_instance.to_dict()
# create an instance of ProfileUpdateProfileRequest from a dict
profile_update_profile_request_from_dict = ProfileUpdateProfileRequest.from_dict(profile_update_profile_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


