# BoostGetBoostFrameworksRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**limit** | **int** |  | [optional] [default to 50]
**cursor** | **str** |  | [optional] 
**query** | [**BoostGetBoostFrameworksRequestQuery**](BoostGetBoostFrameworksRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_boost_frameworks_request import BoostGetBoostFrameworksRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostFrameworksRequest from a JSON string
boost_get_boost_frameworks_request_instance = BoostGetBoostFrameworksRequest.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostFrameworksRequest.to_json())

# convert the object into a dict
boost_get_boost_frameworks_request_dict = boost_get_boost_frameworks_request_instance.to_dict()
# create an instance of BoostGetBoostFrameworksRequest from a dict
boost_get_boost_frameworks_request_from_dict = BoostGetBoostFrameworksRequest.from_dict(boost_get_boost_frameworks_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


