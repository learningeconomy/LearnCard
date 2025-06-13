# DidMetadataAddDidMetadataRequestServiceInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**type** | [**BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType**](BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType.md) |  | 
**service_endpoint** | [**DidMetadataAddDidMetadataRequestServiceInnerServiceEndpoint**](DidMetadataAddDidMetadataRequestServiceInnerServiceEndpoint.md) |  | [optional] 

## Example

```python
from openapi_client.models.did_metadata_add_did_metadata_request_service_inner import DidMetadataAddDidMetadataRequestServiceInner

# TODO update the JSON string below
json = "{}"
# create an instance of DidMetadataAddDidMetadataRequestServiceInner from a JSON string
did_metadata_add_did_metadata_request_service_inner_instance = DidMetadataAddDidMetadataRequestServiceInner.from_json(json)
# print the JSON string representation of the object
print(DidMetadataAddDidMetadataRequestServiceInner.to_json())

# convert the object into a dict
did_metadata_add_did_metadata_request_service_inner_dict = did_metadata_add_did_metadata_request_service_inner_instance.to_dict()
# create an instance of DidMetadataAddDidMetadataRequestServiceInner from a dict
did_metadata_add_did_metadata_request_service_inner_from_dict = DidMetadataAddDidMetadataRequestServiceInner.from_dict(did_metadata_add_did_metadata_request_service_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


