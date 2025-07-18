# ProfileSetPrimarySigningAuthorityRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**endpoint** | **str** |  | 
**name** | **str** |  | 

## Example

```python
from openapi_client.models.profile_set_primary_signing_authority_request import ProfileSetPrimarySigningAuthorityRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileSetPrimarySigningAuthorityRequest from a JSON string
profile_set_primary_signing_authority_request_instance = ProfileSetPrimarySigningAuthorityRequest.from_json(json)
# print the JSON string representation of the object
print(ProfileSetPrimarySigningAuthorityRequest.to_json())

# convert the object into a dict
profile_set_primary_signing_authority_request_dict = profile_set_primary_signing_authority_request_instance.to_dict()
# create an instance of ProfileSetPrimarySigningAuthorityRequest from a dict
profile_set_primary_signing_authority_request_from_dict = ProfileSetPrimarySigningAuthorityRequest.from_dict(profile_set_primary_signing_authority_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


