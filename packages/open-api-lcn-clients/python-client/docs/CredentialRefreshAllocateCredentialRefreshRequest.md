# CredentialRefreshAllocateCredentialRefreshRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**holder** | [**CredentialRefreshAllocateCredentialRefreshRequestHolder**](CredentialRefreshAllocateCredentialRefreshRequestHolder.md) |  | 
**credential_id** | **str** |  | 

## Example

```python
from openapi_client.models.credential_refresh_allocate_credential_refresh_request import CredentialRefreshAllocateCredentialRefreshRequest

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialRefreshAllocateCredentialRefreshRequest from a JSON string
credential_refresh_allocate_credential_refresh_request_instance = CredentialRefreshAllocateCredentialRefreshRequest.from_json(json)
# print the JSON string representation of the object
print(CredentialRefreshAllocateCredentialRefreshRequest.to_json())

# convert the object into a dict
credential_refresh_allocate_credential_refresh_request_dict = credential_refresh_allocate_credential_refresh_request_instance.to_dict()
# create an instance of CredentialRefreshAllocateCredentialRefreshRequest from a dict
credential_refresh_allocate_credential_refresh_request_from_dict = CredentialRefreshAllocateCredentialRefreshRequest.from_dict(credential_refresh_allocate_credential_refresh_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


