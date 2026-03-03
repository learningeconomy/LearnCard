# DidMetadataUpdateDidMetadataRequestUpdates


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendRequestTemplateCredentialAnyOfContextInner]**](BoostSendRequestTemplateCredentialAnyOfContextInner.md) |  | [optional] 
**id** | **str** |  | [optional] 
**also_known_as** | **str** |  | [optional] 
**controller** | [**BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType**](BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType.md) |  | [optional] 
**verification_method** | [**List[DidMetadataAddDidMetadataRequestAuthenticationInner]**](DidMetadataAddDidMetadataRequestAuthenticationInner.md) |  | [optional] 
**authentication** | [**List[DidMetadataAddDidMetadataRequestAuthenticationInner]**](DidMetadataAddDidMetadataRequestAuthenticationInner.md) |  | [optional] 
**assertion_method** | [**List[DidMetadataAddDidMetadataRequestAuthenticationInner]**](DidMetadataAddDidMetadataRequestAuthenticationInner.md) |  | [optional] 
**key_agreement** | [**List[DidMetadataAddDidMetadataRequestAuthenticationInner]**](DidMetadataAddDidMetadataRequestAuthenticationInner.md) |  | [optional] 
**capability_invocation** | [**List[DidMetadataAddDidMetadataRequestAuthenticationInner]**](DidMetadataAddDidMetadataRequestAuthenticationInner.md) |  | [optional] 
**capability_delegation** | [**List[DidMetadataAddDidMetadataRequestAuthenticationInner]**](DidMetadataAddDidMetadataRequestAuthenticationInner.md) |  | [optional] 
**public_key** | [**List[DidMetadataAddDidMetadataRequestAuthenticationInner]**](DidMetadataAddDidMetadataRequestAuthenticationInner.md) |  | [optional] 
**service** | [**List[DidMetadataGetDidMetadata200ResponseServiceInner]**](DidMetadataGetDidMetadata200ResponseServiceInner.md) |  | [optional] 
**proof** | [**BoostSendRequestTemplateCredentialAnyOfProof**](BoostSendRequestTemplateCredentialAnyOfProof.md) |  | [optional] 

## Example

```python
from openapi_client.models.did_metadata_update_did_metadata_request_updates import DidMetadataUpdateDidMetadataRequestUpdates

# TODO update the JSON string below
json = "{}"
# create an instance of DidMetadataUpdateDidMetadataRequestUpdates from a JSON string
did_metadata_update_did_metadata_request_updates_instance = DidMetadataUpdateDidMetadataRequestUpdates.from_json(json)
# print the JSON string representation of the object
print(DidMetadataUpdateDidMetadataRequestUpdates.to_json())

# convert the object into a dict
did_metadata_update_did_metadata_request_updates_dict = did_metadata_update_did_metadata_request_updates_instance.to_dict()
# create an instance of DidMetadataUpdateDidMetadataRequestUpdates from a dict
did_metadata_update_did_metadata_request_updates_from_dict = DidMetadataUpdateDidMetadataRequestUpdates.from_dict(did_metadata_update_did_metadata_request_updates_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


