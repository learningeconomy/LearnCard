# ClaimHookGetClaimHooksForBoost200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**created_at** | **str** |  | 
**updated_at** | **str** |  | 
**type** | **str** |  | 
**data** | [**ClaimHookCreateClaimHookRequestHookOneOf1Data**](ClaimHookCreateClaimHookRequestHookOneOf1Data.md) |  | 

## Example

```python
from openapi_client.models.claim_hook_get_claim_hooks_for_boost200_response_records_inner import ClaimHookGetClaimHooksForBoost200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of ClaimHookGetClaimHooksForBoost200ResponseRecordsInner from a JSON string
claim_hook_get_claim_hooks_for_boost200_response_records_inner_instance = ClaimHookGetClaimHooksForBoost200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(ClaimHookGetClaimHooksForBoost200ResponseRecordsInner.to_json())

# convert the object into a dict
claim_hook_get_claim_hooks_for_boost200_response_records_inner_dict = claim_hook_get_claim_hooks_for_boost200_response_records_inner_instance.to_dict()
# create an instance of ClaimHookGetClaimHooksForBoost200ResponseRecordsInner from a dict
claim_hook_get_claim_hooks_for_boost200_response_records_inner_from_dict = ClaimHookGetClaimHooksForBoost200ResponseRecordsInner.from_dict(claim_hook_get_claim_hooks_for_boost200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


