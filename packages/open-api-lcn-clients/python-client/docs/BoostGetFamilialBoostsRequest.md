# BoostGetFamilialBoostsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**uri** | **str** |  | 
**query** | [**BoostGetBoostsRequestQuery**](BoostGetBoostsRequestQuery.md) |  | [optional] 
**parent_generations** | **float** |  | [optional] [default to 1]
**child_generations** | **float** |  | [optional] [default to 1]
**include_extended_family** | **bool** |  | [optional] [default to False]

## Example

```python
from openapi_client.models.boost_get_familial_boosts_request import BoostGetFamilialBoostsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetFamilialBoostsRequest from a JSON string
boost_get_familial_boosts_request_instance = BoostGetFamilialBoostsRequest.from_json(json)
# print the JSON string representation of the object
print(BoostGetFamilialBoostsRequest.to_json())

# convert the object into a dict
boost_get_familial_boosts_request_dict = boost_get_familial_boosts_request_instance.to_dict()
# create an instance of BoostGetFamilialBoostsRequest from a dict
boost_get_familial_boosts_request_from_dict = BoostGetFamilialBoostsRequest.from_dict(boost_get_familial_boosts_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


