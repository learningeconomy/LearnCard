# DidMetadataGetDidMetadata200ResponseVerificationMethodInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendRequestTemplateCredentialAnyOfContextInner]**](BoostSendRequestTemplateCredentialAnyOfContextInner.md) |  | [optional] 
**id** | **str** |  | 
**type** | **str** |  | 
**controller** | **str** |  | 
**public_key_jwk** | [**DidMetadataGetDidMetadata200ResponseVerificationMethodInnerAnyOfPublicKeyJwk**](DidMetadataGetDidMetadata200ResponseVerificationMethodInnerAnyOfPublicKeyJwk.md) |  | [optional] 
**public_key_base58** | **str** |  | [optional] 
**public_key_multibase** | **str** |  | [optional] 
**block_chain_account_id** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.did_metadata_get_did_metadata200_response_verification_method_inner import DidMetadataGetDidMetadata200ResponseVerificationMethodInner

# TODO update the JSON string below
json = "{}"
# create an instance of DidMetadataGetDidMetadata200ResponseVerificationMethodInner from a JSON string
did_metadata_get_did_metadata200_response_verification_method_inner_instance = DidMetadataGetDidMetadata200ResponseVerificationMethodInner.from_json(json)
# print the JSON string representation of the object
print(DidMetadataGetDidMetadata200ResponseVerificationMethodInner.to_json())

# convert the object into a dict
did_metadata_get_did_metadata200_response_verification_method_inner_dict = did_metadata_get_did_metadata200_response_verification_method_inner_instance.to_dict()
# create an instance of DidMetadataGetDidMetadata200ResponseVerificationMethodInner from a dict
did_metadata_get_did_metadata200_response_verification_method_inner_from_dict = DidMetadataGetDidMetadata200ResponseVerificationMethodInner.from_dict(did_metadata_get_did_metadata200_response_verification_method_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


