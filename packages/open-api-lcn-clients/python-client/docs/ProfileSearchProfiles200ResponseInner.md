# ProfileSearchProfiles200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile_id** | **str** | Unique, URL-safe identifier for the profile. | 
**display_name** | **str** | Human-readable display name for the profile. | [default to '']
**short_bio** | **str** | Short bio for the profile. | [default to '']
**bio** | **str** | Longer bio for the profile. | [default to '']
**did** | **str** | Decentralized Identifier for the profile. (auto-assigned) | 
**is_private** | **bool** | Whether the profile is private or not and shows up in search results. | [optional] 
**email** | **str** | Contact email address for the profile. | [optional] 
**image** | **str** | Profile image URL for the profile. | [optional] 
**hero_image** | **str** | Hero image URL for the profile. | [optional] 
**website_link** | **str** | Website link for the profile. | [optional] 
**is_service_profile** | **bool** | Whether the profile is a service profile or not. | [optional] [default to False]
**type** | **str** | Profile type: e.g. \&quot;person\&quot;, \&quot;organization\&quot;, \&quot;service\&quot;. | [optional] 
**notifications_webhook** | **str** | URL to send notifications to. | [optional] 
**display** | [**BoostGetBoostRecipients200ResponseInnerToDisplay**](BoostGetBoostRecipients200ResponseInnerToDisplay.md) |  | [optional] 
**role** | **str** | Role of the profile: e.g. \&quot;teacher\&quot;, \&quot;student\&quot;. | [optional] [default to '']
**dob** | **str** | Date of birth of the profile: e.g. \&quot;1990-01-01\&quot;. | [optional] [default to '']
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


