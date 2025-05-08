# BoostGenerateClaimLinkRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**boost_uri** | **str** |  | 
**challenge** | **str** |  | [optional] 
**claim_link_sa** | [**BoostGenerateClaimLinkRequestClaimLinkSA**](BoostGenerateClaimLinkRequestClaimLinkSA.md) |  | 
**options** | [**BoostGenerateClaimLinkRequestOptions**](BoostGenerateClaimLinkRequestOptions.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_generate_claim_link_request import BoostGenerateClaimLinkRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGenerateClaimLinkRequest from a JSON string
boost_generate_claim_link_request_instance = BoostGenerateClaimLinkRequest.from_json(json)
# print the JSON string representation of the object
print(BoostGenerateClaimLinkRequest.to_json())

# convert the object into a dict
boost_generate_claim_link_request_dict = boost_generate_claim_link_request_instance.to_dict()
# create an instance of BoostGenerateClaimLinkRequest from a dict
boost_generate_claim_link_request_from_dict = BoostGenerateClaimLinkRequest.from_dict(boost_generate_claim_link_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


