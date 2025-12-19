# ProfileGetAvailableProfiles200ResponseRecordsInnerManager


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**created** | **str** |  | 
**display_name** | **str** |  | [optional] [default to '']
**short_bio** | **str** |  | [optional] [default to '']
**bio** | **str** |  | [optional] [default to '']
**email** | **str** |  | [optional] 
**image** | **str** |  | [optional] 
**hero_image** | **str** |  | [optional] 
**did** | **str** |  | 

## Example

```python
from openapi_client.models.profile_get_available_profiles200_response_records_inner_manager import ProfileGetAvailableProfiles200ResponseRecordsInnerManager

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileGetAvailableProfiles200ResponseRecordsInnerManager from a JSON string
profile_get_available_profiles200_response_records_inner_manager_instance = ProfileGetAvailableProfiles200ResponseRecordsInnerManager.from_json(json)
# print the JSON string representation of the object
print(ProfileGetAvailableProfiles200ResponseRecordsInnerManager.to_json())

# convert the object into a dict
profile_get_available_profiles200_response_records_inner_manager_dict = profile_get_available_profiles200_response_records_inner_manager_instance.to_dict()
# create an instance of ProfileGetAvailableProfiles200ResponseRecordsInnerManager from a dict
profile_get_available_profiles200_response_records_inner_manager_from_dict = ProfileGetAvailableProfiles200ResponseRecordsInnerManager.from_dict(profile_get_available_profiles200_response_records_inner_manager_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


