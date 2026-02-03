# ProfileListInvites200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**challenge** | **str** |  | 
**expires_in** | **float** |  | 
**uses_remaining** | **float** |  | 
**max_uses** | **float** |  | 

## Example

```python
from openapi_client.models.profile_list_invites200_response_inner import ProfileListInvites200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileListInvites200ResponseInner from a JSON string
profile_list_invites200_response_inner_instance = ProfileListInvites200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(ProfileListInvites200ResponseInner.to_json())

# convert the object into a dict
profile_list_invites200_response_inner_dict = profile_list_invites200_response_inner_instance.to_dict()
# create an instance of ProfileListInvites200ResponseInner from a dict
profile_list_invites200_response_inner_from_dict = ProfileListInvites200ResponseInner.from_dict(profile_list_invites200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


