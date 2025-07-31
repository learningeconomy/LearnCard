# BoostCountFamilialBoostsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**query** | [**BoostGetBoostsRequestQuery**](BoostGetBoostsRequestQuery.md) |  | [optional] 
**parent_generations** | **float** |  | [optional] [default to 1]
**child_generations** | **float** |  | [optional] [default to 1]
**include_extended_family** | **bool** |  | [optional] [default to False]

## Example

```python
from openapi_client.models.boost_count_familial_boosts_request import BoostCountFamilialBoostsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostCountFamilialBoostsRequest from a JSON string
boost_count_familial_boosts_request_instance = BoostCountFamilialBoostsRequest.from_json(json)
# print the JSON string representation of the object
print(BoostCountFamilialBoostsRequest.to_json())

# convert the object into a dict
boost_count_familial_boosts_request_dict = boost_count_familial_boosts_request_instance.to_dict()
# create an instance of BoostCountFamilialBoostsRequest from a dict
boost_count_familial_boosts_request_from_dict = BoostCountFamilialBoostsRequest.from_dict(boost_count_familial_boosts_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


