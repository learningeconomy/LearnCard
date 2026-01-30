# BoostGetBoostParentsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**uri** | **str** |  | 
**query** | [**BoostGetBoostsRequestQuery**](BoostGetBoostsRequestQuery.md) |  | [optional] 
**number_of_generations** | [**BoostGetBoostRecipientsWithChildrenCountRequestNumberOfGenerations**](BoostGetBoostRecipientsWithChildrenCountRequestNumberOfGenerations.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_boost_parents_request import BoostGetBoostParentsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostParentsRequest from a JSON string
boost_get_boost_parents_request_instance = BoostGetBoostParentsRequest.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostParentsRequest.to_json())

# convert the object into a dict
boost_get_boost_parents_request_dict = boost_get_boost_parents_request_instance.to_dict()
# create an instance of BoostGetBoostParentsRequest from a dict
boost_get_boost_parents_request_from_dict = BoostGetBoostParentsRequest.from_dict(boost_get_boost_parents_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


