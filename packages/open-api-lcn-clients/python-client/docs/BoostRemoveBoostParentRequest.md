# BoostRemoveBoostParentRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**parent_uri** | **str** |  | 
**child_uri** | **str** |  | 

## Example

```python
from openapi_client.models.boost_remove_boost_parent_request import BoostRemoveBoostParentRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostRemoveBoostParentRequest from a JSON string
boost_remove_boost_parent_request_instance = BoostRemoveBoostParentRequest.from_json(json)
# print the JSON string representation of the object
print(BoostRemoveBoostParentRequest.to_json())

# convert the object into a dict
boost_remove_boost_parent_request_dict = boost_remove_boost_parent_request_instance.to_dict()
# create an instance of BoostRemoveBoostParentRequest from a dict
boost_remove_boost_parent_request_from_dict = BoostRemoveBoostParentRequest.from_dict(boost_remove_boost_parent_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


