# CredentialGetHolderExportMetadata200ResponseLimits


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**max_consent_records** | **float** |  | 
**max_transactions_per_consent_record** | **float** |  | 

## Example

```python
from openapi_client.models.credential_get_holder_export_metadata200_response_limits import CredentialGetHolderExportMetadata200ResponseLimits

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialGetHolderExportMetadata200ResponseLimits from a JSON string
credential_get_holder_export_metadata200_response_limits_instance = CredentialGetHolderExportMetadata200ResponseLimits.from_json(json)
# print the JSON string representation of the object
print(CredentialGetHolderExportMetadata200ResponseLimits.to_json())

# convert the object into a dict
credential_get_holder_export_metadata200_response_limits_dict = credential_get_holder_export_metadata200_response_limits_instance.to_dict()
# create an instance of CredentialGetHolderExportMetadata200ResponseLimits from a dict
credential_get_holder_export_metadata200_response_limits_from_dict = CredentialGetHolderExportMetadata200ResponseLimits.from_dict(credential_get_holder_export_metadata200_response_limits_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


