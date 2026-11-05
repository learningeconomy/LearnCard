# ProfileSearchProfiles200ResponseInnerAnyOf1

## Properties

| Name                          | Type                                                                                                                    | Description                                                                                 | Notes                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------- |
| **connection_status**         | **str**                                                                                                                 |                                                                                             | [optional]                    |
| **profile_id**                | **str**                                                                                                                 | Unique, URL-safe identifier for the profile.                                                |
| **display_name**              | **str**                                                                                                                 | Human-readable display name for the profile.                                                | [default to '']               |
| **short_bio**                 | **str**                                                                                                                 | Short bio for the profile.                                                                  | [default to '']               |
| **image**                     | **str**                                                                                                                 | Profile image URL for the profile.                                                          | [optional]                    |
| **hero_image**                | **str**                                                                                                                 | Hero image URL for the profile.                                                             | [optional]                    |
| **linked_in_organization_id** | **str**                                                                                                                 | Numeric LinkedIn organization ID.                                                           | [optional]                    |
| **type**                      | **str**                                                                                                                 | Profile type: e.g. \&quot;person\&quot;, \&quot;organization\&quot;, \&quot;service\&quot;. | [optional]                    |
| **is_service_profile**        | **bool**                                                                                                                | Whether the profile is a service profile or not.                                            | [optional] [default to False] |
| **display**                   | [**BoostGetBoostRecipients200ResponseInnerToAnyOf1Display**](BoostGetBoostRecipients200ResponseInnerToAnyOf1Display.md) |                                                                                             | [optional]                    |
| **bio**                       | **str**                                                                                                                 | Longer bio for the profile.                                                                 | [default to '']               |
| **website_link**              | **str**                                                                                                                 | Website link for the profile.                                                               | [optional]                    |
| **role**                      | **str**                                                                                                                 | Role of the profile: e.g. \&quot;teacher\&quot;, \&quot;student\&quot;.                     | [optional] [default to '']    |
| **highlighted_credentials**   | **List[str]**                                                                                                           | Up to 5 unique boost URIs to highlight on the profile.                                      | [optional]                    |
| **did**                       | **str**                                                                                                                 | Decentralized Identifier for the profile. (auto-assigned)                                   |

## Example

```python
from openapi_client.models.profile_search_profiles200_response_inner_any_of1 import ProfileSearchProfiles200ResponseInnerAnyOf1

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileSearchProfiles200ResponseInnerAnyOf1 from a JSON string
profile_search_profiles200_response_inner_any_of1_instance = ProfileSearchProfiles200ResponseInnerAnyOf1.from_json(json)
# print the JSON string representation of the object
print(ProfileSearchProfiles200ResponseInnerAnyOf1.to_json())

# convert the object into a dict
profile_search_profiles200_response_inner_any_of1_dict = profile_search_profiles200_response_inner_any_of1_instance.to_dict()
# create an instance of ProfileSearchProfiles200ResponseInnerAnyOf1 from a dict
profile_search_profiles200_response_inner_any_of1_from_dict = ProfileSearchProfiles200ResponseInnerAnyOf1.from_dict(profile_search_profiles200_response_inner_any_of1_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
