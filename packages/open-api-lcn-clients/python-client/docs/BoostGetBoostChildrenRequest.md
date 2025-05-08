# BoostGetBoostChildrenRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**uri** | **str** |  | 
**query** | [**BoostGetBoostsRequestQuery**](BoostGetBoostsRequestQuery.md) |  | [optional] 
**number_of_generations** | **float** |  | [optional] [default to 1]

## Example

```python
from openapi_client.models.boost_get_boost_children_request import BoostGetBoostChildrenRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostChildrenRequest from a JSON string
boost_get_boost_children_request_instance = BoostGetBoostChildrenRequest.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostChildrenRequest.to_json())

# convert the object into a dict
boost_get_boost_children_request_dict = boost_get_boost_children_request_instance.to_dict()
# create an instance of BoostGetBoostChildrenRequest from a dict
boost_get_boost_children_request_from_dict = BoostGetBoostChildrenRequest.from_dict(boost_get_boost_children_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


