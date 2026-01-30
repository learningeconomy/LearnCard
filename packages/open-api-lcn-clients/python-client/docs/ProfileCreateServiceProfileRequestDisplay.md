# ProfileCreateServiceProfileRequestDisplay

Display settings for the profile.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**background_color** | **str** |  | [optional] 
**background_image** | **str** |  | [optional] 
**fade_background_image** | **bool** |  | [optional] 
**repeat_background_image** | **bool** |  | [optional] 
**font_color** | **str** |  | [optional] 
**accent_color** | **str** |  | [optional] 
**accent_font_color** | **str** |  | [optional] 
**id_background_image** | **str** |  | [optional] 
**fade_id_background_image** | **bool** |  | [optional] 
**id_background_color** | **str** |  | [optional] 
**repeat_id_background_image** | **bool** |  | [optional] 

## Example

```python
from openapi_client.models.profile_create_service_profile_request_display import ProfileCreateServiceProfileRequestDisplay

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileCreateServiceProfileRequestDisplay from a JSON string
profile_create_service_profile_request_display_instance = ProfileCreateServiceProfileRequestDisplay.from_json(json)
# print the JSON string representation of the object
print(ProfileCreateServiceProfileRequestDisplay.to_json())

# convert the object into a dict
profile_create_service_profile_request_display_dict = profile_create_service_profile_request_display_instance.to_dict()
# create an instance of ProfileCreateServiceProfileRequestDisplay from a dict
profile_create_service_profile_request_display_from_dict = ProfileCreateServiceProfileRequestDisplay.from_dict(profile_create_service_profile_request_display_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


