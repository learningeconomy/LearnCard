# BoostCountBoostChildrenRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**query** | [**BoostGetBoostsRequestQuery**](BoostGetBoostsRequestQuery.md) |  | [optional] 
**number_of_generations** | **float** |  | [optional] [default to 1]

## Example

```python
from openapi_client.models.boost_count_boost_children_request import BoostCountBoostChildrenRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostCountBoostChildrenRequest from a JSON string
boost_count_boost_children_request_instance = BoostCountBoostChildrenRequest.from_json(json)
# print the JSON string representation of the object
print(BoostCountBoostChildrenRequest.to_json())

# convert the object into a dict
boost_count_boost_children_request_dict = boost_count_boost_children_request_instance.to_dict()
# create an instance of BoostCountBoostChildrenRequest from a dict
boost_count_boost_children_request_from_dict = BoostCountBoostChildrenRequest.from_dict(boost_count_boost_children_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


