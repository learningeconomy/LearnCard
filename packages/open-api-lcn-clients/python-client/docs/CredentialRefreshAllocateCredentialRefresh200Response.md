# CredentialRefreshAllocateCredentialRefresh200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**refresh_id** | **str** |  | 
**refresh_service** | [**CredentialRefreshAllocateCredentialRefresh200ResponseRefreshService**](CredentialRefreshAllocateCredentialRefresh200ResponseRefreshService.md) |  | 

## Example

```python
from openapi_client.models.credential_refresh_allocate_credential_refresh200_response import CredentialRefreshAllocateCredentialRefresh200Response

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialRefreshAllocateCredentialRefresh200Response from a JSON string
credential_refresh_allocate_credential_refresh200_response_instance = CredentialRefreshAllocateCredentialRefresh200Response.from_json(json)
# print the JSON string representation of the object
print(CredentialRefreshAllocateCredentialRefresh200Response.to_json())

# convert the object into a dict
credential_refresh_allocate_credential_refresh200_response_dict = credential_refresh_allocate_credential_refresh200_response_instance.to_dict()
# create an instance of CredentialRefreshAllocateCredentialRefresh200Response from a dict
credential_refresh_allocate_credential_refresh200_response_from_dict = CredentialRefreshAllocateCredentialRefresh200Response.from_dict(credential_refresh_allocate_credential_refresh200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


