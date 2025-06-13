# ProfileSigningAuthorities200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**signing_authority** | [**ProfileSigningAuthorities200ResponseInnerSigningAuthority**](ProfileSigningAuthorities200ResponseInnerSigningAuthority.md) |  | 
**relationship** | [**ProfileSigningAuthorities200ResponseInnerRelationship**](ProfileSigningAuthorities200ResponseInnerRelationship.md) |  | 

## Example

```python
from openapi_client.models.profile_signing_authorities200_response_inner import ProfileSigningAuthorities200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileSigningAuthorities200ResponseInner from a JSON string
profile_signing_authorities200_response_inner_instance = ProfileSigningAuthorities200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(ProfileSigningAuthorities200ResponseInner.to_json())

# convert the object into a dict
profile_signing_authorities200_response_inner_dict = profile_signing_authorities200_response_inner_instance.to_dict()
# create an instance of ProfileSigningAuthorities200ResponseInner from a dict
profile_signing_authorities200_response_inner_from_dict = ProfileSigningAuthorities200ResponseInner.from_dict(profile_signing_authorities200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


