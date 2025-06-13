# BoostUpdateBoostPermissionsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**updates** | [**BoostUpdateBoostPermissionsRequestUpdates**](BoostUpdateBoostPermissionsRequestUpdates.md) |  | 

## Example

```python
from openapi_client.models.boost_update_boost_permissions_request import BoostUpdateBoostPermissionsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostUpdateBoostPermissionsRequest from a JSON string
boost_update_boost_permissions_request_instance = BoostUpdateBoostPermissionsRequest.from_json(json)
# print the JSON string representation of the object
print(BoostUpdateBoostPermissionsRequest.to_json())

# convert the object into a dict
boost_update_boost_permissions_request_dict = boost_update_boost_permissions_request_instance.to_dict()
# create an instance of BoostUpdateBoostPermissionsRequest from a dict
boost_update_boost_permissions_request_from_dict = BoostUpdateBoostPermissionsRequest.from_dict(boost_update_boost_permissions_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


