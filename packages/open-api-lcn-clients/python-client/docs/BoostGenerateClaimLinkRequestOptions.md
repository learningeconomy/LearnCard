# BoostGenerateClaimLinkRequestOptions


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**ttl_seconds** | **float** |  | [optional] 
**total_uses** | **float** |  | [optional] 

## Example

```python
from openapi_client.models.boost_generate_claim_link_request_options import BoostGenerateClaimLinkRequestOptions

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGenerateClaimLinkRequestOptions from a JSON string
boost_generate_claim_link_request_options_instance = BoostGenerateClaimLinkRequestOptions.from_json(json)
# print the JSON string representation of the object
print(BoostGenerateClaimLinkRequestOptions.to_json())

# convert the object into a dict
boost_generate_claim_link_request_options_dict = boost_generate_claim_link_request_options_instance.to_dict()
# create an instance of BoostGenerateClaimLinkRequestOptions from a dict
boost_generate_claim_link_request_options_from_dict = BoostGenerateClaimLinkRequestOptions.from_dict(boost_generate_claim_link_request_options_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


