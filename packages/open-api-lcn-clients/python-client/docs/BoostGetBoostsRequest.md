# BoostGetBoostsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**query** | [**BoostGetBoostsRequestQuery**](BoostGetBoostsRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_boosts_request import BoostGetBoostsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostsRequest from a JSON string
boost_get_boosts_request_instance = BoostGetBoostsRequest.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostsRequest.to_json())

# convert the object into a dict
boost_get_boosts_request_dict = boost_get_boosts_request_instance.to_dict()
# create an instance of BoostGetBoostsRequest from a dict
boost_get_boosts_request_from_dict = BoostGetBoostsRequest.from_dict(boost_get_boosts_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


