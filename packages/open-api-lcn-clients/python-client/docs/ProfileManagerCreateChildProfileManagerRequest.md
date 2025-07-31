# ProfileManagerCreateChildProfileManagerRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**parent_uri** | **str** |  | 
**profile** | [**ProfileManagerCreateProfileManagerRequest**](ProfileManagerCreateProfileManagerRequest.md) |  | 

## Example

```python
from openapi_client.models.profile_manager_create_child_profile_manager_request import ProfileManagerCreateChildProfileManagerRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileManagerCreateChildProfileManagerRequest from a JSON string
profile_manager_create_child_profile_manager_request_instance = ProfileManagerCreateChildProfileManagerRequest.from_json(json)
# print the JSON string representation of the object
print(ProfileManagerCreateChildProfileManagerRequest.to_json())

# convert the object into a dict
profile_manager_create_child_profile_manager_request_dict = profile_manager_create_child_profile_manager_request_instance.to_dict()
# create an instance of ProfileManagerCreateChildProfileManagerRequest from a dict
profile_manager_create_child_profile_manager_request_from_dict = ProfileManagerCreateChildProfileManagerRequest.from_dict(profile_manager_create_child_profile_manager_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


