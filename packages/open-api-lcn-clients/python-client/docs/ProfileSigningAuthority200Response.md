# ProfileSigningAuthority200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**signing_authority** | [**ProfileSigningAuthorities200ResponseInnerSigningAuthority**](ProfileSigningAuthorities200ResponseInnerSigningAuthority.md) |  | 
**relationship** | [**ProfileSigningAuthorities200ResponseInnerRelationship**](ProfileSigningAuthorities200ResponseInnerRelationship.md) |  | 

## Example

```python
from openapi_client.models.profile_signing_authority200_response import ProfileSigningAuthority200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileSigningAuthority200Response from a JSON string
profile_signing_authority200_response_instance = ProfileSigningAuthority200Response.from_json(json)
# print the JSON string representation of the object
print(ProfileSigningAuthority200Response.to_json())

# convert the object into a dict
profile_signing_authority200_response_dict = profile_signing_authority200_response_instance.to_dict()
# create an instance of ProfileSigningAuthority200Response from a dict
profile_signing_authority200_response_from_dict = ProfileSigningAuthority200Response.from_dict(profile_signing_authority200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


