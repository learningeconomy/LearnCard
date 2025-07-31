# ProfileManagerCreateProfileManagerRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**display_name** | **str** |  | [optional] [default to '']
**short_bio** | **str** |  | [optional] [default to '']
**bio** | **str** |  | [optional] [default to '']
**email** | **str** |  | [optional] 
**image** | **str** |  | [optional] 
**hero_image** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.profile_manager_create_profile_manager_request import ProfileManagerCreateProfileManagerRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileManagerCreateProfileManagerRequest from a JSON string
profile_manager_create_profile_manager_request_instance = ProfileManagerCreateProfileManagerRequest.from_json(json)
# print the JSON string representation of the object
print(ProfileManagerCreateProfileManagerRequest.to_json())

# convert the object into a dict
profile_manager_create_profile_manager_request_dict = profile_manager_create_profile_manager_request_instance.to_dict()
# create an instance of ProfileManagerCreateProfileManagerRequest from a dict
profile_manager_create_profile_manager_request_from_dict = ProfileManagerCreateProfileManagerRequest.from_dict(profile_manager_create_profile_manager_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


