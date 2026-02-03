# ActivityGetMyActivities200ResponseRecordsInner


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
**boost** | [**ActivityGetMyActivities200ResponseRecordsInnerBoost**](ActivityGetMyActivities200ResponseRecordsInnerBoost.md) |  | [optional] 
**recipient_profile** | [**ActivityGetMyActivities200ResponseRecordsInnerRecipientProfile**](ActivityGetMyActivities200ResponseRecordsInnerRecipientProfile.md) |  | [optional] 

## Example

```python
from openapi_client.models.activity_get_my_activities200_response_records_inner import ActivityGetMyActivities200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of ActivityGetMyActivities200ResponseRecordsInner from a JSON string
activity_get_my_activities200_response_records_inner_instance = ActivityGetMyActivities200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(ActivityGetMyActivities200ResponseRecordsInner.to_json())

# convert the object into a dict
activity_get_my_activities200_response_records_inner_dict = activity_get_my_activities200_response_records_inner_instance.to_dict()
# create an instance of ActivityGetMyActivities200ResponseRecordsInner from a dict
activity_get_my_activities200_response_records_inner_from_dict = ActivityGetMyActivities200ResponseRecordsInner.from_dict(activity_get_my_activities200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


