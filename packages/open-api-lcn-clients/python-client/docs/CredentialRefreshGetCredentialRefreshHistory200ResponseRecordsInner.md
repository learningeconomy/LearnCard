# CredentialRefreshGetCredentialRefreshHistory200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**version** | **int** |  | 
**published_at** | **str** |  | 
**effective_at** | **str** |  | [optional] 
**etag** | **str** |  | [optional] 
**signing_mode** | **str** |  | [optional] 
**update_summary** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.credential_refresh_get_credential_refresh_history200_response_records_inner import CredentialRefreshGetCredentialRefreshHistory200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialRefreshGetCredentialRefreshHistory200ResponseRecordsInner from a JSON string
credential_refresh_get_credential_refresh_history200_response_records_inner_instance = CredentialRefreshGetCredentialRefreshHistory200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(CredentialRefreshGetCredentialRefreshHistory200ResponseRecordsInner.to_json())

# convert the object into a dict
credential_refresh_get_credential_refresh_history200_response_records_inner_dict = credential_refresh_get_credential_refresh_history200_response_records_inner_instance.to_dict()
# create an instance of CredentialRefreshGetCredentialRefreshHistory200ResponseRecordsInner from a dict
credential_refresh_get_credential_refresh_history200_response_records_inner_from_dict = CredentialRefreshGetCredentialRefreshHistory200ResponseRecordsInner.from_dict(credential_refresh_get_credential_refresh_history200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


