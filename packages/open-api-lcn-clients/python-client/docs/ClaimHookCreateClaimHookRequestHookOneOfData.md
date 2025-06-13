# ClaimHookCreateClaimHookRequestHookOneOfData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**claim_uri** | **str** |  | 
**target_uri** | **str** |  | 
**permissions** | [**BoostCreateBoostRequestClaimPermissions**](BoostCreateBoostRequestClaimPermissions.md) |  | 

## Example

```python
from openapi_client.models.claim_hook_create_claim_hook_request_hook_one_of_data import ClaimHookCreateClaimHookRequestHookOneOfData

# TODO update the JSON string below
json = "{}"
# create an instance of ClaimHookCreateClaimHookRequestHookOneOfData from a JSON string
claim_hook_create_claim_hook_request_hook_one_of_data_instance = ClaimHookCreateClaimHookRequestHookOneOfData.from_json(json)
# print the JSON string representation of the object
print(ClaimHookCreateClaimHookRequestHookOneOfData.to_json())

# convert the object into a dict
claim_hook_create_claim_hook_request_hook_one_of_data_dict = claim_hook_create_claim_hook_request_hook_one_of_data_instance.to_dict()
# create an instance of ClaimHookCreateClaimHookRequestHookOneOfData from a dict
claim_hook_create_claim_hook_request_hook_one_of_data_from_dict = ClaimHookCreateClaimHookRequestHookOneOfData.from_dict(claim_hook_create_claim_hook_request_hook_one_of_data_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


