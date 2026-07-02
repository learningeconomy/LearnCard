# BoostGetBoostRecipients200ResponseInnerToAnyOf2


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile_id** | **str** | Unique, URL-safe identifier for the profile. | 
**display_name** | **str** | Human-readable display name for the profile. | [default to '']
**short_bio** | **str** | Short bio for the profile. | [default to '']
**image** | **str** | Profile image URL for the profile. | [optional] 
**hero_image** | **str** | Hero image URL for the profile. | [optional] 
**type** | **str** | Profile type: e.g. \&quot;person\&quot;, \&quot;organization\&quot;, \&quot;service\&quot;. | [optional] 
**is_service_profile** | **bool** | Whether the profile is a service profile or not. | [optional] [default to False]
**display** | [**BoostGetBoostRecipients200ResponseInnerToAnyOf1Display**](BoostGetBoostRecipients200ResponseInnerToAnyOf1Display.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_boost_recipients200_response_inner_to_any_of2 import BoostGetBoostRecipients200ResponseInnerToAnyOf2

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostRecipients200ResponseInnerToAnyOf2 from a JSON string
boost_get_boost_recipients200_response_inner_to_any_of2_instance = BoostGetBoostRecipients200ResponseInnerToAnyOf2.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostRecipients200ResponseInnerToAnyOf2.to_json())

# convert the object into a dict
boost_get_boost_recipients200_response_inner_to_any_of2_dict = boost_get_boost_recipients200_response_inner_to_any_of2_instance.to_dict()
# create an instance of BoostGetBoostRecipients200ResponseInnerToAnyOf2 from a dict
boost_get_boost_recipients200_response_inner_to_any_of2_from_dict = BoostGetBoostRecipients200ResponseInnerToAnyOf2.from_dict(boost_get_boost_recipients200_response_inner_to_any_of2_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


