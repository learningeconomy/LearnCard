# ProfileManagerGetManagedProfilesRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**query** | [**BoostGetPaginatedBoostRecipientsRequestQuery**](BoostGetPaginatedBoostRecipientsRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.profile_manager_get_managed_profiles_request import ProfileManagerGetManagedProfilesRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileManagerGetManagedProfilesRequest from a JSON string
profile_manager_get_managed_profiles_request_instance = ProfileManagerGetManagedProfilesRequest.from_json(json)
# print the JSON string representation of the object
print(ProfileManagerGetManagedProfilesRequest.to_json())

# convert the object into a dict
profile_manager_get_managed_profiles_request_dict = profile_manager_get_managed_profiles_request_instance.to_dict()
# create an instance of ProfileManagerGetManagedProfilesRequest from a dict
profile_manager_get_managed_profiles_request_from_dict = ProfileManagerGetManagedProfilesRequest.from_dict(profile_manager_get_managed_profiles_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


