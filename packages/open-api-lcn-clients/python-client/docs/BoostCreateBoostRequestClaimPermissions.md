# BoostCreateBoostRequestClaimPermissions


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**role** | **str** |  | [optional] 
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
from openapi_client.models.boost_create_boost_request_claim_permissions import BoostCreateBoostRequestClaimPermissions

# TODO update the JSON string below
json = "{}"
# create an instance of BoostCreateBoostRequestClaimPermissions from a JSON string
boost_create_boost_request_claim_permissions_instance = BoostCreateBoostRequestClaimPermissions.from_json(json)
# print the JSON string representation of the object
print(BoostCreateBoostRequestClaimPermissions.to_json())

# convert the object into a dict
boost_create_boost_request_claim_permissions_dict = boost_create_boost_request_claim_permissions_instance.to_dict()
# create an instance of BoostCreateBoostRequestClaimPermissions from a dict
boost_create_boost_request_claim_permissions_from_dict = BoostCreateBoostRequestClaimPermissions.from_dict(boost_create_boost_request_claim_permissions_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


