# ClaimHookCreateClaimHookRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**hook** | [**ClaimHookCreateClaimHookRequestHook**](ClaimHookCreateClaimHookRequestHook.md) |  | 

## Example

```python
from openapi_client.models.claim_hook_create_claim_hook_request import ClaimHookCreateClaimHookRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ClaimHookCreateClaimHookRequest from a JSON string
claim_hook_create_claim_hook_request_instance = ClaimHookCreateClaimHookRequest.from_json(json)
# print the JSON string representation of the object
print(ClaimHookCreateClaimHookRequest.to_json())

# convert the object into a dict
claim_hook_create_claim_hook_request_dict = claim_hook_create_claim_hook_request_instance.to_dict()
# create an instance of ClaimHookCreateClaimHookRequest from a dict
claim_hook_create_claim_hook_request_from_dict = ClaimHookCreateClaimHookRequest.from_dict(claim_hook_create_claim_hook_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


