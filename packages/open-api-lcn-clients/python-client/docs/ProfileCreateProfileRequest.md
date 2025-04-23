# ProfileCreateProfileRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile_id** | **str** |  | 
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
from openapi_client.models.profile_create_profile_request import ProfileCreateProfileRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileCreateProfileRequest from a JSON string
profile_create_profile_request_instance = ProfileCreateProfileRequest.from_json(json)
# print the JSON string representation of the object
print(ProfileCreateProfileRequest.to_json())

# convert the object into a dict
profile_create_profile_request_dict = profile_create_profile_request_instance.to_dict()
# create an instance of ProfileCreateProfileRequest from a dict
profile_create_profile_request_from_dict = ProfileCreateProfileRequest.from_dict(profile_create_profile_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


