# BoostCreateChildBoostRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**parent_uri** | **str** |  | 
**boost** | [**BoostCreateBoostRequest**](BoostCreateBoostRequest.md) |  | 

## Example

```python
from openapi_client.models.boost_create_child_boost_request import BoostCreateChildBoostRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostCreateChildBoostRequest from a JSON string
boost_create_child_boost_request_instance = BoostCreateChildBoostRequest.from_json(json)
# print the JSON string representation of the object
print(BoostCreateChildBoostRequest.to_json())

# convert the object into a dict
boost_create_child_boost_request_dict = boost_create_child_boost_request_instance.to_dict()
# create an instance of BoostCreateChildBoostRequest from a dict
boost_create_child_boost_request_from_dict = BoostCreateChildBoostRequest.from_dict(boost_create_child_boost_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


