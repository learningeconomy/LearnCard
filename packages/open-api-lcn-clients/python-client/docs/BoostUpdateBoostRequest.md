# BoostUpdateBoostRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**updates** | [**BoostUpdateBoostRequestUpdates**](BoostUpdateBoostRequestUpdates.md) |  | 

## Example

```python
from openapi_client.models.boost_update_boost_request import BoostUpdateBoostRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostUpdateBoostRequest from a JSON string
boost_update_boost_request_instance = BoostUpdateBoostRequest.from_json(json)
# print the JSON string representation of the object
print(BoostUpdateBoostRequest.to_json())

# convert the object into a dict
boost_update_boost_request_dict = boost_update_boost_request_instance.to_dict()
# create an instance of BoostUpdateBoostRequest from a dict
boost_update_boost_request_from_dict = BoostUpdateBoostRequest.from_dict(boost_update_boost_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


