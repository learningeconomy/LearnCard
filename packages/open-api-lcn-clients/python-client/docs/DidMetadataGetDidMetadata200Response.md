# DidMetadataGetDidMetadata200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendBoostRequestCredentialAnyOfContextInner]**](BoostSendBoostRequestCredentialAnyOfContextInner.md) |  | [optional] 
**id** | **str** |  | [optional] 
**also_known_as** | **str** |  | [optional] 
**controller** | [**BoostSendBoostRequestCredentialAnyOfEvidenceAnyOfType**](BoostSendBoostRequestCredentialAnyOfEvidenceAnyOfType.md) |  | [optional] 
**verification_method** | [**List[DidMetadataAddDidMetadataRequestVerificationMethodInner]**](DidMetadataAddDidMetadataRequestVerificationMethodInner.md) |  | [optional] 
**authentication** | [**List[DidMetadataAddDidMetadataRequestVerificationMethodInner]**](DidMetadataAddDidMetadataRequestVerificationMethodInner.md) |  | [optional] 
**assertion_method** | [**List[DidMetadataAddDidMetadataRequestVerificationMethodInner]**](DidMetadataAddDidMetadataRequestVerificationMethodInner.md) |  | [optional] 
**key_agreement** | [**List[DidMetadataAddDidMetadataRequestVerificationMethodInner]**](DidMetadataAddDidMetadataRequestVerificationMethodInner.md) |  | [optional] 
**capability_invocation** | [**List[DidMetadataAddDidMetadataRequestVerificationMethodInner]**](DidMetadataAddDidMetadataRequestVerificationMethodInner.md) |  | [optional] 
**capability_delegation** | [**List[DidMetadataAddDidMetadataRequestVerificationMethodInner]**](DidMetadataAddDidMetadataRequestVerificationMethodInner.md) |  | [optional] 
**public_key** | [**List[DidMetadataAddDidMetadataRequestVerificationMethodInner]**](DidMetadataAddDidMetadataRequestVerificationMethodInner.md) |  | [optional] 
**service** | [**List[DidMetadataAddDidMetadataRequestServiceInner]**](DidMetadataAddDidMetadataRequestServiceInner.md) |  | [optional] 
**proof** | [**BoostSendBoostRequestCredentialAnyOfProof**](BoostSendBoostRequestCredentialAnyOfProof.md) |  | [optional] 

## Example

```python
from openapi_client.models.did_metadata_get_did_metadata200_response import DidMetadataGetDidMetadata200Response

# TODO update the JSON string below
json = "{}"
# create an instance of DidMetadataGetDidMetadata200Response from a JSON string
did_metadata_get_did_metadata200_response_instance = DidMetadataGetDidMetadata200Response.from_json(json)
# print the JSON string representation of the object
print(DidMetadataGetDidMetadata200Response.to_json())

# convert the object into a dict
did_metadata_get_did_metadata200_response_dict = did_metadata_get_did_metadata200_response_instance.to_dict()
# create an instance of DidMetadataGetDidMetadata200Response from a dict
did_metadata_get_did_metadata200_response_from_dict = DidMetadataGetDidMetadata200Response.from_dict(did_metadata_get_did_metadata200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


