# ProfileGetProfile200Response


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

## Example

```python
from openapi_client.models.profile_get_profile200_response import ProfileGetProfile200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ProfileGetProfile200Response from a JSON string
profile_get_profile200_response_instance = ProfileGetProfile200Response.from_json(json)
# print the JSON string representation of the object
print(ProfileGetProfile200Response.to_json())

# convert the object into a dict
profile_get_profile200_response_dict = profile_get_profile200_response_instance.to_dict()
# create an instance of ProfileGetProfile200Response from a dict
profile_get_profile200_response_from_dict = ProfileGetProfile200Response.from_dict(profile_get_profile200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


