# ProfileGetAvailableProfiles200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile** | [**BoostGetBoostRecipients200ResponseInnerTo**](BoostGetBoostRecipients200ResponseInnerTo.md) |  | 
**manager** | [**BoostGetChildrenProfileManagers200ResponseRecordsInner**](BoostGetChildrenProfileManagers200ResponseRecordsInner.md) |  | [optional] 

## Example

```python
from openapi_client.models.profile_get_available_profiles200_response_records_inner import ProfileGetAvailableProfiles200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileGetAvailableProfiles200ResponseRecordsInner from a JSON string
profile_get_available_profiles200_response_records_inner_instance = ProfileGetAvailableProfiles200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(ProfileGetAvailableProfiles200ResponseRecordsInner.to_json())

# convert the object into a dict
profile_get_available_profiles200_response_records_inner_dict = profile_get_available_profiles200_response_records_inner_instance.to_dict()
# create an instance of ProfileGetAvailableProfiles200ResponseRecordsInner from a dict
profile_get_available_profiles200_response_records_inner_from_dict = ProfileGetAvailableProfiles200ResponseRecordsInner.from_dict(profile_get_available_profiles200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


