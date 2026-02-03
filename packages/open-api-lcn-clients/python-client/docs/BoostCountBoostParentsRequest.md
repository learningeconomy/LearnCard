# BoostCountBoostParentsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**query** | [**BoostGetBoostsRequestQuery**](BoostGetBoostsRequestQuery.md) |  | [optional] 
**number_of_generations** | [**BoostGetBoostRecipientsWithChildrenCountRequestNumberOfGenerations**](BoostGetBoostRecipientsWithChildrenCountRequestNumberOfGenerations.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_count_boost_parents_request import BoostCountBoostParentsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostCountBoostParentsRequest from a JSON string
boost_count_boost_parents_request_instance = BoostCountBoostParentsRequest.from_json(json)
# print the JSON string representation of the object
print(BoostCountBoostParentsRequest.to_json())

# convert the object into a dict
boost_count_boost_parents_request_dict = boost_count_boost_parents_request_instance.to_dict()
# create an instance of BoostCountBoostParentsRequest from a dict
boost_count_boost_parents_request_from_dict = BoostCountBoostParentsRequest.from_dict(boost_count_boost_parents_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


