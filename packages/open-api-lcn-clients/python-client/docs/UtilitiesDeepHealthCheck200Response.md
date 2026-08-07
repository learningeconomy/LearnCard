# UtilitiesDeepHealthCheck200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**healthy** | **bool** |  | 
**version** | **str** |  | 
**didkit_engine** | **str** |  | 
**did** | **str** |  | 
**vp_verified** | **bool** |  | 
**verification_errors** | **List[str]** |  | 
**ms** | **float** |  | 

## Example

```python
from openapi_client.models.utilities_deep_health_check200_response import UtilitiesDeepHealthCheck200Response

# TODO update the JSON string below
json = "{}"
# create an instance of UtilitiesDeepHealthCheck200Response from a JSON string
utilities_deep_health_check200_response_instance = UtilitiesDeepHealthCheck200Response.from_json(json)
# print the JSON string representation of the object
print(UtilitiesDeepHealthCheck200Response.to_json())

# convert the object into a dict
utilities_deep_health_check200_response_dict = utilities_deep_health_check200_response_instance.to_dict()
# create an instance of UtilitiesDeepHealthCheck200Response from a dict
utilities_deep_health_check200_response_from_dict = UtilitiesDeepHealthCheck200Response.from_dict(utilities_deep_health_check200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


