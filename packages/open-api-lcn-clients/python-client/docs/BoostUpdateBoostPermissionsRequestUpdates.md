# BoostUpdateBoostPermissionsRequestUpdates


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**can_edit** | **bool** |  | [optional] 
**can_issue** | **bool** |  | [optional] 
**can_revoke** | **bool** |  | [optional] 
**can_manage_permissions** | **bool** |  | [optional] 
**can_issue_children** | **str** |  | [optional] 
**can_create_children** | **str** |  | [optional] 
**can_edit_children** | **str** |  | [optional] 
**can_revoke_children** | **str** |  | [optional] 
**can_manage_children_permissions** | **str** |  | [optional] 
**can_manage_children_profiles** | **bool** |  | [optional] [default to False]
**can_view_analytics** | **bool** |  | [optional] 

## Example

```python
from openapi_client.models.boost_update_boost_permissions_request_updates import BoostUpdateBoostPermissionsRequestUpdates

# TODO update the JSON string below
json = "{}"
# create an instance of BoostUpdateBoostPermissionsRequestUpdates from a JSON string
boost_update_boost_permissions_request_updates_instance = BoostUpdateBoostPermissionsRequestUpdates.from_json(json)
# print the JSON string representation of the object
print(BoostUpdateBoostPermissionsRequestUpdates.to_json())

# convert the object into a dict
boost_update_boost_permissions_request_updates_dict = boost_update_boost_permissions_request_updates_instance.to_dict()
# create an instance of BoostUpdateBoostPermissionsRequestUpdates from a dict
boost_update_boost_permissions_request_updates_from_dict = BoostUpdateBoostPermissionsRequestUpdates.from_dict(boost_update_boost_permissions_request_updates_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


