# ActivityGetActivityChain200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**activity_id** | **str** |  | 
**event_type** | **str** |  | 
**timestamp** | **str** |  | 
**actor_profile_id** | **str** |  | 
**recipient_type** | **str** |  | 
**recipient_identifier** | **str** |  | 
**boost_uri** | **str** |  | [optional] 
**credential_uri** | **str** |  | [optional] 
**inbox_credential_id** | **str** |  | [optional] 
**integration_id** | **str** |  | [optional] 
**source** | **str** |  | 
**metadata** | **Dict[str, object]** |  | [optional] 
**boost** | [**ActivityGetActivity200ResponseBoost**](ActivityGetActivity200ResponseBoost.md) |  | [optional] 
**recipient_profile** | [**ActivityGetActivity200ResponseRecipientProfile**](ActivityGetActivity200ResponseRecipientProfile.md) |  | [optional] 

## Example

```python
from openapi_client.models.activity_get_activity_chain200_response_inner import ActivityGetActivityChain200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of ActivityGetActivityChain200ResponseInner from a JSON string
activity_get_activity_chain200_response_inner_instance = ActivityGetActivityChain200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(ActivityGetActivityChain200ResponseInner.to_json())

# convert the object into a dict
activity_get_activity_chain200_response_inner_dict = activity_get_activity_chain200_response_inner_instance.to_dict()
# create an instance of ActivityGetActivityChain200ResponseInner from a dict
activity_get_activity_chain200_response_inner_from_dict = ActivityGetActivityChain200ResponseInner.from_dict(activity_get_activity_chain200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


