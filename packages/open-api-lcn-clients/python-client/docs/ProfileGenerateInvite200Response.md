# ProfileGenerateInvite200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile_id** | **str** |  | 
**challenge** | **str** |  | 
**expires_in** | **float** |  | 

## Example

```python
from openapi_client.models.profile_generate_invite200_response import ProfileGenerateInvite200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileGenerateInvite200Response from a JSON string
profile_generate_invite200_response_instance = ProfileGenerateInvite200Response.from_json(json)
# print the JSON string representation of the object
print(ProfileGenerateInvite200Response.to_json())

# convert the object into a dict
profile_generate_invite200_response_dict = profile_generate_invite200_response_instance.to_dict()
# create an instance of ProfileGenerateInvite200Response from a dict
profile_generate_invite200_response_from_dict = ProfileGenerateInvite200Response.from_dict(profile_generate_invite200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


