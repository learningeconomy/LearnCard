# ClaimHookCreateClaimHookRequestHook


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **str** |  | 
**data** | [**ClaimHookCreateClaimHookRequestHookOneOf1Data**](ClaimHookCreateClaimHookRequestHookOneOf1Data.md) |  | 

## Example

```python
from openapi_client.models.claim_hook_create_claim_hook_request_hook import ClaimHookCreateClaimHookRequestHook

# TODO update the JSON string below
json = "{}"
# create an instance of ClaimHookCreateClaimHookRequestHook from a JSON string
claim_hook_create_claim_hook_request_hook_instance = ClaimHookCreateClaimHookRequestHook.from_json(json)
# print the JSON string representation of the object
print(ClaimHookCreateClaimHookRequestHook.to_json())

# convert the object into a dict
claim_hook_create_claim_hook_request_hook_dict = claim_hook_create_claim_hook_request_hook_instance.to_dict()
# create an instance of ClaimHookCreateClaimHookRequestHook from a dict
claim_hook_create_claim_hook_request_hook_from_dict = ClaimHookCreateClaimHookRequestHook.from_dict(claim_hook_create_claim_hook_request_hook_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


