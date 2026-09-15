# CredentialGetHolderExportMetadata200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**consent_records** | [**List[CredentialGetHolderExportMetadata200ResponseConsentRecordsInner]**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInner.md) |  | 
**truncated** | **bool** |  | [optional] 
**warnings** | **List[str]** |  | [optional] 
**limits** | [**CredentialGetHolderExportMetadata200ResponseLimits**](CredentialGetHolderExportMetadata200ResponseLimits.md) |  | [optional] 

## Example

```python
from openapi_client.models.credential_get_holder_export_metadata200_response import CredentialGetHolderExportMetadata200Response

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialGetHolderExportMetadata200Response from a JSON string
credential_get_holder_export_metadata200_response_instance = CredentialGetHolderExportMetadata200Response.from_json(json)
# print the JSON string representation of the object
print(CredentialGetHolderExportMetadata200Response.to_json())

# convert the object into a dict
credential_get_holder_export_metadata200_response_dict = credential_get_holder_export_metadata200_response_instance.to_dict()
# create an instance of CredentialGetHolderExportMetadata200Response from a dict
credential_get_holder_export_metadata200_response_from_dict = CredentialGetHolderExportMetadata200Response.from_dict(credential_get_holder_export_metadata200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


