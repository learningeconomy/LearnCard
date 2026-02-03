# ActivityGetMyActivities200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**records** | [**List[ActivityGetMyActivities200ResponseRecordsInner]**](ActivityGetMyActivities200ResponseRecordsInner.md) |  | 
**has_more** | **bool** |  | 
**cursor** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.activity_get_my_activities200_response import ActivityGetMyActivities200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ActivityGetMyActivities200Response from a JSON string
activity_get_my_activities200_response_instance = ActivityGetMyActivities200Response.from_json(json)
# print the JSON string representation of the object
print(ActivityGetMyActivities200Response.to_json())

# convert the object into a dict
activity_get_my_activities200_response_dict = activity_get_my_activities200_response_instance.to_dict()
# create an instance of ActivityGetMyActivities200Response from a dict
activity_get_my_activities200_response_from_dict = ActivityGetMyActivities200Response.from_dict(activity_get_my_activities200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


