# ProfileGetAvailableProfiles200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cursor** | **str** |  | [optional] 
**has_more** | **bool** |  | 
**records** | [**List[ProfileGetAvailableProfiles200ResponseRecordsInner]**](ProfileGetAvailableProfiles200ResponseRecordsInner.md) |  | 

## Example

```python
from openapi_client.models.profile_get_available_profiles200_response import ProfileGetAvailableProfiles200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileGetAvailableProfiles200Response from a JSON string
profile_get_available_profiles200_response_instance = ProfileGetAvailableProfiles200Response.from_json(json)
# print the JSON string representation of the object
print(ProfileGetAvailableProfiles200Response.to_json())

# convert the object into a dict
profile_get_available_profiles200_response_dict = profile_get_available_profiles200_response_instance.to_dict()
# create an instance of ProfileGetAvailableProfiles200Response from a dict
profile_get_available_profiles200_response_from_dict = ProfileGetAvailableProfiles200Response.from_dict(profile_get_available_profiles200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


