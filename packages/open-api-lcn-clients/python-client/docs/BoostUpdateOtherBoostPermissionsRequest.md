# BoostUpdateOtherBoostPermissionsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**updates** | [**BoostUpdateOtherBoostPermissionsRequestUpdates**](BoostUpdateOtherBoostPermissionsRequestUpdates.md) |  | 

## Example

```python
from openapi_client.models.boost_update_other_boost_permissions_request import BoostUpdateOtherBoostPermissionsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostUpdateOtherBoostPermissionsRequest from a JSON string
boost_update_other_boost_permissions_request_instance = BoostUpdateOtherBoostPermissionsRequest.from_json(json)
# print the JSON string representation of the object
print(BoostUpdateOtherBoostPermissionsRequest.to_json())

# convert the object into a dict
boost_update_other_boost_permissions_request_dict = boost_update_other_boost_permissions_request_instance.to_dict()
# create an instance of BoostUpdateOtherBoostPermissionsRequest from a dict
boost_update_other_boost_permissions_request_from_dict = BoostUpdateOtherBoostPermissionsRequest.from_dict(boost_update_other_boost_permissions_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


