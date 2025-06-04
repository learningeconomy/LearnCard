# ClaimHookGetClaimHooksForBoostRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**query** | [**ClaimHookGetClaimHooksForBoostRequestQuery**](ClaimHookGetClaimHooksForBoostRequestQuery.md) |  | [optional] 
**uri** | **str** |  | 

## Example

```python
from openapi_client.models.claim_hook_get_claim_hooks_for_boost_request import ClaimHookGetClaimHooksForBoostRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ClaimHookGetClaimHooksForBoostRequest from a JSON string
claim_hook_get_claim_hooks_for_boost_request_instance = ClaimHookGetClaimHooksForBoostRequest.from_json(json)
# print the JSON string representation of the object
print(ClaimHookGetClaimHooksForBoostRequest.to_json())

# convert the object into a dict
claim_hook_get_claim_hooks_for_boost_request_dict = claim_hook_get_claim_hooks_for_boost_request_instance.to_dict()
# create an instance of ClaimHookGetClaimHooksForBoostRequest from a dict
claim_hook_get_claim_hooks_for_boost_request_from_dict = ClaimHookGetClaimHooksForBoostRequest.from_dict(claim_hook_get_claim_hooks_for_boost_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


