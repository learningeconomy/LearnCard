# ClaimHookGetClaimHooksForBoost200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cursor** | **str** |  | [optional] 
**has_more** | **bool** |  | 
**records** | [**List[ClaimHookGetClaimHooksForBoost200ResponseRecordsInner]**](ClaimHookGetClaimHooksForBoost200ResponseRecordsInner.md) |  | 

## Example

```python
from openapi_client.models.claim_hook_get_claim_hooks_for_boost200_response import ClaimHookGetClaimHooksForBoost200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ClaimHookGetClaimHooksForBoost200Response from a JSON string
claim_hook_get_claim_hooks_for_boost200_response_instance = ClaimHookGetClaimHooksForBoost200Response.from_json(json)
# print the JSON string representation of the object
print(ClaimHookGetClaimHooksForBoost200Response.to_json())

# convert the object into a dict
claim_hook_get_claim_hooks_for_boost200_response_dict = claim_hook_get_claim_hooks_for_boost200_response_instance.to_dict()
# create an instance of ClaimHookGetClaimHooksForBoost200Response from a dict
claim_hook_get_claim_hooks_for_boost200_response_from_dict = ClaimHookGetClaimHooksForBoost200Response.from_dict(claim_hook_get_claim_hooks_for_boost200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


