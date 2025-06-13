# DidMetadataAddDidMetadataRequestVerificationMethodInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendBoostRequestCredentialAnyOfContextInner]**](BoostSendBoostRequestCredentialAnyOfContextInner.md) |  | [optional] 
**id** | **str** |  | 
**type** | **str** |  | 
**controller** | **str** |  | 
**public_key_jwk** | [**DidMetadataAddDidMetadataRequestVerificationMethodInnerAnyOfPublicKeyJwk**](DidMetadataAddDidMetadataRequestVerificationMethodInnerAnyOfPublicKeyJwk.md) |  | [optional] 
**public_key_base58** | **str** |  | [optional] 
**block_chain_account_id** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.did_metadata_add_did_metadata_request_verification_method_inner import DidMetadataAddDidMetadataRequestVerificationMethodInner

# TODO update the JSON string below
json = "{}"
# create an instance of DidMetadataAddDidMetadataRequestVerificationMethodInner from a JSON string
did_metadata_add_did_metadata_request_verification_method_inner_instance = DidMetadataAddDidMetadataRequestVerificationMethodInner.from_json(json)
# print the JSON string representation of the object
print(DidMetadataAddDidMetadataRequestVerificationMethodInner.to_json())

# convert the object into a dict
did_metadata_add_did_metadata_request_verification_method_inner_dict = did_metadata_add_did_metadata_request_verification_method_inner_instance.to_dict()
# create an instance of DidMetadataAddDidMetadataRequestVerificationMethodInner from a dict
did_metadata_add_did_metadata_request_verification_method_inner_from_dict = DidMetadataAddDidMetadataRequestVerificationMethodInner.from_dict(did_metadata_add_did_metadata_request_verification_method_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


