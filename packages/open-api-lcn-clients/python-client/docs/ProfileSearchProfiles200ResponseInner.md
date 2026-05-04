# ProfileSearchProfiles200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**connection_status** | **str** |  | [optional] 
**profile_id** | **str** | Unique, URL-safe identifier for the profile. | 
**display_name** | **str** | Human-readable display name for the profile. | [default to '']
**short_bio** | **str** | Short bio for the profile. | [default to '']
**image** | **str** | Profile image URL for the profile. | [optional] 
**hero_image** | **str** | Hero image URL for the profile. | [optional] 
**type** | **str** | Profile type: e.g. \&quot;person\&quot;, \&quot;organization\&quot;, \&quot;service\&quot;. | [optional] 
**is_service_profile** | **bool** | Whether the profile is a service profile or not. | [optional] [default to False]
**display** | [**BoostGetBoostRecipients200ResponseInnerToAnyOf1Display**](BoostGetBoostRecipients200ResponseInnerToAnyOf1Display.md) |  | [optional] 
**bio** | **str** | Longer bio for the profile. | [default to '']
**website_link** | **str** | Website link for the profile. | [optional] 
**role** | **str** | Role of the profile: e.g. \&quot;teacher\&quot;, \&quot;student\&quot;. | [optional] [default to '']
**highlighted_credentials** | **List[str]** | Up to 5 unique boost URIs to highlight on the profile. | [optional] 
**did** | **str** | Decentralized Identifier for the profile. (auto-assigned) | 
**email** | **str** | Contact email address for the profile. (deprecated) | [optional] 
**is_private** | **bool** | Whether the profile is private or not and shows up in search results. | [optional] 
**profile_visibility** | **str** | Profile visibility: &#39;public&#39;, &#39;connections_only&#39;, or &#39;private&#39;. | [optional] [default to 'public']
**show_email** | **bool** | Whether to show email to connections. | [optional] [default to False]
**allow_connection_requests** | **str** | Who can send connection requests: &#39;anyone&#39; or &#39;invite_only&#39;. | [optional] [default to 'anyone']
**notifications_webhook** | **str** | URL to send notifications to. | [optional] 
**dob** | **str** | Date of birth of the profile: e.g. \&quot;1990-01-01\&quot;. | [optional] [default to '']
**country** | **str** | Country for the profile. | [optional] 
**approved** | **bool** | Approval status for the profile. | [optional] 

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


