# BoostCountBoostSiblingsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**query** | [**BoostGetBoostsRequestQuery**](BoostGetBoostsRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_count_boost_siblings_request import BoostCountBoostSiblingsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostCountBoostSiblingsRequest from a JSON string
boost_count_boost_siblings_request_instance = BoostCountBoostSiblingsRequest.from_json(json)
# print the JSON string representation of the object
print(BoostCountBoostSiblingsRequest.to_json())

# convert the object into a dict
boost_count_boost_siblings_request_dict = boost_count_boost_siblings_request_instance.to_dict()
# create an instance of BoostCountBoostSiblingsRequest from a dict
boost_count_boost_siblings_request_from_dict = BoostCountBoostSiblingsRequest.from_dict(boost_count_boost_siblings_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


