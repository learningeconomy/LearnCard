# DidMetadataGetDidMetadata200ResponseServiceInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**type** | [**BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType**](BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType.md) |  | 
**service_endpoint** | **List[object]** |  | 

## Example

```python
from openapi_client.models.did_metadata_get_did_metadata200_response_service_inner import DidMetadataGetDidMetadata200ResponseServiceInner

# TODO update the JSON string below
json = "{}"
# create an instance of DidMetadataGetDidMetadata200ResponseServiceInner from a JSON string
did_metadata_get_did_metadata200_response_service_inner_instance = DidMetadataGetDidMetadata200ResponseServiceInner.from_json(json)
# print the JSON string representation of the object
print(DidMetadataGetDidMetadata200ResponseServiceInner.to_json())

# convert the object into a dict
did_metadata_get_did_metadata200_response_service_inner_dict = did_metadata_get_did_metadata200_response_service_inner_instance.to_dict()
# create an instance of DidMetadataGetDidMetadata200ResponseServiceInner from a dict
did_metadata_get_did_metadata200_response_service_inner_from_dict = DidMetadataGetDidMetadata200ResponseServiceInner.from_dict(did_metadata_get_did_metadata200_response_service_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


