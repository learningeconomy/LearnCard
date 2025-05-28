# ProfileManagerGetProfileManager200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**created** | **str** |  | 
**display_name** | **str** |  | [optional] [default to '']
**short_bio** | **str** |  | [optional] [default to '']
**bio** | **str** |  | [optional] [default to '']
**email** | **str** |  | [optional] 
**image** | **str** |  | [optional] 
**hero_image** | **str** |  | [optional] 
**did** | **str** |  | 

## Example

```python
from openapi_client.models.profile_manager_get_profile_manager200_response import ProfileManagerGetProfileManager200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileManagerGetProfileManager200Response from a JSON string
profile_manager_get_profile_manager200_response_instance = ProfileManagerGetProfileManager200Response.from_json(json)
# print the JSON string representation of the object
print(ProfileManagerGetProfileManager200Response.to_json())

# convert the object into a dict
profile_manager_get_profile_manager200_response_dict = profile_manager_get_profile_manager200_response_instance.to_dict()
# create an instance of ProfileManagerGetProfileManager200Response from a dict
profile_manager_get_profile_manager200_response_from_dict = ProfileManagerGetProfileManager200Response.from_dict(profile_manager_get_profile_manager200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


