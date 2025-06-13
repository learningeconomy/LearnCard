# ProfileRegisterSigningAuthorityRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**endpoint** | **str** |  | 
**name** | **str** |  | 
**did** | **str** |  | 

## Example

```python
from openapi_client.models.profile_register_signing_authority_request import ProfileRegisterSigningAuthorityRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileRegisterSigningAuthorityRequest from a JSON string
profile_register_signing_authority_request_instance = ProfileRegisterSigningAuthorityRequest.from_json(json)
# print the JSON string representation of the object
print(ProfileRegisterSigningAuthorityRequest.to_json())

# convert the object into a dict
profile_register_signing_authority_request_dict = profile_register_signing_authority_request_instance.to_dict()
# create an instance of ProfileRegisterSigningAuthorityRequest from a dict
profile_register_signing_authority_request_from_dict = ProfileRegisterSigningAuthorityRequest.from_dict(profile_register_signing_authority_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


