# DidMetadataGetDidMetadata200ResponseAuthenticationInnerAnyOf


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendRequestTemplateCredentialAnyOfContextInner]**](BoostSendRequestTemplateCredentialAnyOfContextInner.md) |  | [optional] 
**id** | **str** |  | 
**type** | **str** |  | 
**controller** | **str** |  | 
**public_key_jwk** | [**DidMetadataGetDidMetadata200ResponseAuthenticationInnerAnyOfPublicKeyJwk**](DidMetadataGetDidMetadata200ResponseAuthenticationInnerAnyOfPublicKeyJwk.md) |  | [optional] 
**public_key_base58** | **str** |  | [optional] 
**public_key_multibase** | **str** |  | [optional] 
**block_chain_account_id** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.did_metadata_get_did_metadata200_response_authentication_inner_any_of import DidMetadataGetDidMetadata200ResponseAuthenticationInnerAnyOf

# TODO update the JSON string below
json = "{}"
# create an instance of DidMetadataGetDidMetadata200ResponseAuthenticationInnerAnyOf from a JSON string
did_metadata_get_did_metadata200_response_authentication_inner_any_of_instance = DidMetadataGetDidMetadata200ResponseAuthenticationInnerAnyOf.from_json(json)
# print the JSON string representation of the object
print(DidMetadataGetDidMetadata200ResponseAuthenticationInnerAnyOf.to_json())

# convert the object into a dict
did_metadata_get_did_metadata200_response_authentication_inner_any_of_dict = did_metadata_get_did_metadata200_response_authentication_inner_any_of_instance.to_dict()
# create an instance of DidMetadataGetDidMetadata200ResponseAuthenticationInnerAnyOf from a dict
did_metadata_get_did_metadata200_response_authentication_inner_any_of_from_dict = DidMetadataGetDidMetadata200ResponseAuthenticationInnerAnyOf.from_dict(did_metadata_get_did_metadata200_response_authentication_inner_any_of_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


