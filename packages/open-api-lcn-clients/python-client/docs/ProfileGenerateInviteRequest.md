# ProfileGenerateInviteRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**expiration** | **float** |  | [optional] [default to 2592000]
**challenge** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.profile_generate_invite_request import ProfileGenerateInviteRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileGenerateInviteRequest from a JSON string
profile_generate_invite_request_instance = ProfileGenerateInviteRequest.from_json(json)
# print the JSON string representation of the object
print(ProfileGenerateInviteRequest.to_json())

# convert the object into a dict
profile_generate_invite_request_dict = profile_generate_invite_request_instance.to_dict()
# create an instance of ProfileGenerateInviteRequest from a dict
profile_generate_invite_request_from_dict = ProfileGenerateInviteRequest.from_dict(profile_generate_invite_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


