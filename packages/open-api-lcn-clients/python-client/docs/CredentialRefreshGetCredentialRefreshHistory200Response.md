# CredentialRefreshGetCredentialRefreshHistory200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**records** | [**List[CredentialRefreshGetCredentialRefreshHistory200ResponseRecordsInner]**](CredentialRefreshGetCredentialRefreshHistory200ResponseRecordsInner.md) |  | 
**has_more** | **bool** |  | 
**cursor** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.credential_refresh_get_credential_refresh_history200_response import CredentialRefreshGetCredentialRefreshHistory200Response

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialRefreshGetCredentialRefreshHistory200Response from a JSON string
credential_refresh_get_credential_refresh_history200_response_instance = CredentialRefreshGetCredentialRefreshHistory200Response.from_json(json)
# print the JSON string representation of the object
print(CredentialRefreshGetCredentialRefreshHistory200Response.to_json())

# convert the object into a dict
credential_refresh_get_credential_refresh_history200_response_dict = credential_refresh_get_credential_refresh_history200_response_instance.to_dict()
# create an instance of CredentialRefreshGetCredentialRefreshHistory200Response from a dict
credential_refresh_get_credential_refresh_history200_response_from_dict = CredentialRefreshGetCredentialRefreshHistory200Response.from_dict(credential_refresh_get_credential_refresh_history200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


