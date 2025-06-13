# ClaimHookGetClaimHooksForBoostRequestQueryData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**claim_uri** | [**BoostGetBoostsRequestQueryUri**](BoostGetBoostsRequestQueryUri.md) |  | [optional] 
**target_uri** | [**BoostGetBoostsRequestQueryUri**](BoostGetBoostsRequestQueryUri.md) |  | [optional] 
**permissions** | [**ClaimHookGetClaimHooksForBoostRequestQueryDataPermissions**](ClaimHookGetClaimHooksForBoostRequestQueryDataPermissions.md) |  | [optional] 

## Example

```python
from openapi_client.models.claim_hook_get_claim_hooks_for_boost_request_query_data import ClaimHookGetClaimHooksForBoostRequestQueryData

# TODO update the JSON string below
json = "{}"
# create an instance of ClaimHookGetClaimHooksForBoostRequestQueryData from a JSON string
claim_hook_get_claim_hooks_for_boost_request_query_data_instance = ClaimHookGetClaimHooksForBoostRequestQueryData.from_json(json)
# print the JSON string representation of the object
print(ClaimHookGetClaimHooksForBoostRequestQueryData.to_json())

# convert the object into a dict
claim_hook_get_claim_hooks_for_boost_request_query_data_dict = claim_hook_get_claim_hooks_for_boost_request_query_data_instance.to_dict()
# create an instance of ClaimHookGetClaimHooksForBoostRequestQueryData from a dict
claim_hook_get_claim_hooks_for_boost_request_query_data_from_dict = ClaimHookGetClaimHooksForBoostRequestQueryData.from_dict(claim_hook_get_claim_hooks_for_boost_request_query_data_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


