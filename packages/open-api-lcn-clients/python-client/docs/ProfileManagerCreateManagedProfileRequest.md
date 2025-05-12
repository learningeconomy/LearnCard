# ProfileManagerCreateManagedProfileRequest


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
**is_service_profile** | **bool** |  | [optional] [default to False]
**type** | **str** |  | [optional] 
**notifications_webhook** | **str** |  | [optional] 
**display** | [**BoostGetBoostRecipients200ResponseInnerToDisplay**](BoostGetBoostRecipients200ResponseInnerToDisplay.md) |  | [optional] 

## Example

```python
from openapi_client.models.profile_manager_create_managed_profile_request import ProfileManagerCreateManagedProfileRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileManagerCreateManagedProfileRequest from a JSON string
profile_manager_create_managed_profile_request_instance = ProfileManagerCreateManagedProfileRequest.from_json(json)
# print the JSON string representation of the object
print(ProfileManagerCreateManagedProfileRequest.to_json())

# convert the object into a dict
profile_manager_create_managed_profile_request_dict = profile_manager_create_managed_profile_request_instance.to_dict()
# create an instance of ProfileManagerCreateManagedProfileRequest from a dict
profile_manager_create_managed_profile_request_from_dict = ProfileManagerCreateManagedProfileRequest.from_dict(profile_manager_create_managed_profile_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


