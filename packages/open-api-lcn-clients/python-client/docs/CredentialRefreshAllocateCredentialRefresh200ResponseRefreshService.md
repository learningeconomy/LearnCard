# CredentialRefreshAllocateCredentialRefresh200ResponseRefreshService


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**type** | **str** |  | 
**authorization** | [**CredentialRefreshAllocateCredentialRefresh200ResponseRefreshServiceAuthorization**](CredentialRefreshAllocateCredentialRefresh200ResponseRefreshServiceAuthorization.md) |  | 

## Example

```python
from openapi_client.models.credential_refresh_allocate_credential_refresh200_response_refresh_service import CredentialRefreshAllocateCredentialRefresh200ResponseRefreshService

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialRefreshAllocateCredentialRefresh200ResponseRefreshService from a JSON string
credential_refresh_allocate_credential_refresh200_response_refresh_service_instance = CredentialRefreshAllocateCredentialRefresh200ResponseRefreshService.from_json(json)
# print the JSON string representation of the object
print(CredentialRefreshAllocateCredentialRefresh200ResponseRefreshService.to_json())

# convert the object into a dict
credential_refresh_allocate_credential_refresh200_response_refresh_service_dict = credential_refresh_allocate_credential_refresh200_response_refresh_service_instance.to_dict()
# create an instance of CredentialRefreshAllocateCredentialRefresh200ResponseRefreshService from a dict
credential_refresh_allocate_credential_refresh200_response_refresh_service_from_dict = CredentialRefreshAllocateCredentialRefresh200ResponseRefreshService.from_dict(credential_refresh_allocate_credential_refresh200_response_refresh_service_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


