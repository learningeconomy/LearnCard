# ProfileSearchProfiles200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile_id** | **str** |  | 
**display_name** | **str** |  | [optional] [default to '']
**short_bio** | **str** |  | [optional] [default to '']
**bio** | **str** |  | [optional] [default to '']
**did** | **str** |  | 
**is_private** | **bool** |  | [optional] 
**email** | **str** |  | [optional] 
**image** | **str** |  | [optional] 
**hero_image** | **str** |  | [optional] 
**website_link** | **str** |  | [optional] 
**is_service_profile** | **bool** |  | [optional] [default to False]
**type** | **str** |  | [optional] 
**notifications_webhook** | **str** |  | [optional] 
**display** | [**BoostGetBoostRecipients200ResponseInnerToDisplay**](BoostGetBoostRecipients200ResponseInnerToDisplay.md) |  | [optional] 
**connection_status** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.profile_search_profiles200_response_inner import ProfileSearchProfiles200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileSearchProfiles200ResponseInner from a JSON string
profile_search_profiles200_response_inner_instance = ProfileSearchProfiles200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(ProfileSearchProfiles200ResponseInner.to_json())

# convert the object into a dict
profile_search_profiles200_response_inner_dict = profile_search_profiles200_response_inner_instance.to_dict()
# create an instance of ProfileSearchProfiles200ResponseInner from a dict
profile_search_profiles200_response_inner_from_dict = ProfileSearchProfiles200ResponseInner.from_dict(profile_search_profiles200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


