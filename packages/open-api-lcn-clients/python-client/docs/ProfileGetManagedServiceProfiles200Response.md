# ProfileGetManagedServiceProfiles200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cursor** | **str** |  | [optional] 
**has_more** | **bool** |  | 
**records** | [**List[BoostGetBoostRecipients200ResponseInnerToAnyOf3]**](BoostGetBoostRecipients200ResponseInnerToAnyOf3.md) |  | 

## Example

```python
from openapi_client.models.profile_get_managed_service_profiles200_response import ProfileGetManagedServiceProfiles200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileGetManagedServiceProfiles200Response from a JSON string
profile_get_managed_service_profiles200_response_instance = ProfileGetManagedServiceProfiles200Response.from_json(json)
# print the JSON string representation of the object
print(ProfileGetManagedServiceProfiles200Response.to_json())

# convert the object into a dict
profile_get_managed_service_profiles200_response_dict = profile_get_managed_service_profiles200_response_instance.to_dict()
# create an instance of ProfileGetManagedServiceProfiles200Response from a dict
profile_get_managed_service_profiles200_response_from_dict = ProfileGetManagedServiceProfiles200Response.from_dict(profile_get_managed_service_profiles200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


