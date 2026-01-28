# ActivityGetActivityStats200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**total** | **float** |  | 
**created** | **float** |  | 
**delivered** | **float** |  | 
**claimed** | **float** |  | 
**expired** | **float** |  | 
**failed** | **float** |  | 
**claim_rate** | **float** |  | 

## Example

```python
from openapi_client.models.activity_get_activity_stats200_response import ActivityGetActivityStats200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ActivityGetActivityStats200Response from a JSON string
activity_get_activity_stats200_response_instance = ActivityGetActivityStats200Response.from_json(json)
# print the JSON string representation of the object
print(ActivityGetActivityStats200Response.to_json())

# convert the object into a dict
activity_get_activity_stats200_response_dict = activity_get_activity_stats200_response_instance.to_dict()
# create an instance of ActivityGetActivityStats200Response from a dict
activity_get_activity_stats200_response_from_dict = ActivityGetActivityStats200Response.from_dict(activity_get_activity_stats200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


