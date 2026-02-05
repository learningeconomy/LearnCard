# DidMetadataGetMyDidMetadata200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendRequestTemplateCredentialAnyOfContextInner]**](BoostSendRequestTemplateCredentialAnyOfContextInner.md) |  | [optional] 
**id** | **str** |  | 
**also_known_as** | **str** |  | [optional] 
**controller** | [**BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType**](BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType.md) |  | [optional] 
**verification_method** | [**List[DidMetadataGetDidMetadata200ResponseAuthenticationInner]**](DidMetadataGetDidMetadata200ResponseAuthenticationInner.md) |  | [optional] 
**authentication** | [**List[DidMetadataGetDidMetadata200ResponseAuthenticationInner]**](DidMetadataGetDidMetadata200ResponseAuthenticationInner.md) |  | [optional] 
**assertion_method** | [**List[DidMetadataGetDidMetadata200ResponseAuthenticationInner]**](DidMetadataGetDidMetadata200ResponseAuthenticationInner.md) |  | [optional] 
**key_agreement** | [**List[DidMetadataGetDidMetadata200ResponseAuthenticationInner]**](DidMetadataGetDidMetadata200ResponseAuthenticationInner.md) |  | [optional] 
**capability_invocation** | [**List[DidMetadataGetDidMetadata200ResponseAuthenticationInner]**](DidMetadataGetDidMetadata200ResponseAuthenticationInner.md) |  | [optional] 
**capability_delegation** | [**List[DidMetadataGetDidMetadata200ResponseAuthenticationInner]**](DidMetadataGetDidMetadata200ResponseAuthenticationInner.md) |  | [optional] 
**public_key** | [**List[DidMetadataGetDidMetadata200ResponseAuthenticationInner]**](DidMetadataGetDidMetadata200ResponseAuthenticationInner.md) |  | [optional] 
**service** | [**List[DidMetadataGetDidMetadata200ResponseServiceInner]**](DidMetadataGetDidMetadata200ResponseServiceInner.md) |  | [optional] 
**proof** | [**BoostSendRequestTemplateCredentialAnyOfProof**](BoostSendRequestTemplateCredentialAnyOfProof.md) |  | [optional] 

## Example

```python
from openapi_client.models.did_metadata_get_my_did_metadata200_response_inner import DidMetadataGetMyDidMetadata200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of DidMetadataGetMyDidMetadata200ResponseInner from a JSON string
did_metadata_get_my_did_metadata200_response_inner_instance = DidMetadataGetMyDidMetadata200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(DidMetadataGetMyDidMetadata200ResponseInner.to_json())

# convert the object into a dict
did_metadata_get_my_did_metadata200_response_inner_dict = did_metadata_get_my_did_metadata200_response_inner_instance.to_dict()
# create an instance of DidMetadataGetMyDidMetadata200ResponseInner from a dict
did_metadata_get_my_did_metadata200_response_inner_from_dict = DidMetadataGetMyDidMetadata200ResponseInner.from_dict(did_metadata_get_my_did_metadata200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


