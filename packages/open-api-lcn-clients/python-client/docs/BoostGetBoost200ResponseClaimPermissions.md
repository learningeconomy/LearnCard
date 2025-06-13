# BoostGetBoost200ResponseClaimPermissions


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**role** | **str** |  | 
**can_edit** | **bool** |  | 
**can_issue** | **bool** |  | 
**can_revoke** | **bool** |  | 
**can_manage_permissions** | **bool** |  | 
**can_issue_children** | **str** |  | 
**can_create_children** | **str** |  | 
**can_edit_children** | **str** |  | 
**can_revoke_children** | **str** |  | 
**can_manage_children_permissions** | **str** |  | 
**can_manage_children_profiles** | **bool** |  | [optional] [default to False]
**can_view_analytics** | **bool** |  | 

## Example

```python
from openapi_client.models.boost_get_boost200_response_claim_permissions import BoostGetBoost200ResponseClaimPermissions

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoost200ResponseClaimPermissions from a JSON string
boost_get_boost200_response_claim_permissions_instance = BoostGetBoost200ResponseClaimPermissions.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoost200ResponseClaimPermissions.to_json())

# convert the object into a dict
boost_get_boost200_response_claim_permissions_dict = boost_get_boost200_response_claim_permissions_instance.to_dict()
# create an instance of BoostGetBoost200ResponseClaimPermissions from a dict
boost_get_boost200_response_claim_permissions_from_dict = BoostGetBoost200ResponseClaimPermissions.from_dict(boost_get_boost200_response_claim_permissions_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


