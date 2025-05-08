# BoostGetBoostRecipients200ResponseInnerTo


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
from openapi_client.models.boost_get_boost_recipients200_response_inner_to import BoostGetBoostRecipients200ResponseInnerTo

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostRecipients200ResponseInnerTo from a JSON string
boost_get_boost_recipients200_response_inner_to_instance = BoostGetBoostRecipients200ResponseInnerTo.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostRecipients200ResponseInnerTo.to_json())

# convert the object into a dict
boost_get_boost_recipients200_response_inner_to_dict = boost_get_boost_recipients200_response_inner_to_instance.to_dict()
# create an instance of BoostGetBoostRecipients200ResponseInnerTo from a dict
boost_get_boost_recipients200_response_inner_to_from_dict = BoostGetBoostRecipients200ResponseInnerTo.from_dict(boost_get_boost_recipients200_response_inner_to_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


