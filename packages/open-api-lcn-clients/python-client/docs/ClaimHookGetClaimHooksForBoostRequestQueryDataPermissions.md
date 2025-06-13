# ClaimHookGetClaimHooksForBoostRequestQueryDataPermissions


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**role** | [**BoostGetBoostsRequestQueryUri**](BoostGetBoostsRequestQueryUri.md) |  | [optional] 
**can_edit** | **bool** |  | [optional] 
**can_issue** | **bool** |  | [optional] 
**can_revoke** | **bool** |  | [optional] 
**can_manage_permissions** | **bool** |  | [optional] 
**can_issue_children** | [**BoostGetBoostsRequestQueryUri**](BoostGetBoostsRequestQueryUri.md) |  | [optional] 
**can_create_children** | [**BoostGetBoostsRequestQueryUri**](BoostGetBoostsRequestQueryUri.md) |  | [optional] 
**can_edit_children** | [**BoostGetBoostsRequestQueryUri**](BoostGetBoostsRequestQueryUri.md) |  | [optional] 
**can_revoke_children** | [**BoostGetBoostsRequestQueryUri**](BoostGetBoostsRequestQueryUri.md) |  | [optional] 
**can_manage_children_permissions** | [**BoostGetBoostsRequestQueryUri**](BoostGetBoostsRequestQueryUri.md) |  | [optional] 
**can_manage_children_profiles** | **bool** |  | [optional] 
**can_view_analytics** | **bool** |  | [optional] 

## Example

```python
from openapi_client.models.claim_hook_get_claim_hooks_for_boost_request_query_data_permissions import ClaimHookGetClaimHooksForBoostRequestQueryDataPermissions

# TODO update the JSON string below
json = "{}"
# create an instance of ClaimHookGetClaimHooksForBoostRequestQueryDataPermissions from a JSON string
claim_hook_get_claim_hooks_for_boost_request_query_data_permissions_instance = ClaimHookGetClaimHooksForBoostRequestQueryDataPermissions.from_json(json)
# print the JSON string representation of the object
print(ClaimHookGetClaimHooksForBoostRequestQueryDataPermissions.to_json())

# convert the object into a dict
claim_hook_get_claim_hooks_for_boost_request_query_data_permissions_dict = claim_hook_get_claim_hooks_for_boost_request_query_data_permissions_instance.to_dict()
# create an instance of ClaimHookGetClaimHooksForBoostRequestQueryDataPermissions from a dict
claim_hook_get_claim_hooks_for_boost_request_query_data_permissions_from_dict = ClaimHookGetClaimHooksForBoostRequestQueryDataPermissions.from_dict(claim_hook_get_claim_hooks_for_boost_request_query_data_permissions_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


