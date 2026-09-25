# CredentialRefreshPublishCredentialRefreshRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**refresh_id** | **str** |  | 
**notify_holder** | **bool** |  | [optional] 
**update_summary** | **str** |  | [optional] 
**idempotency_key** | **str** |  | [optional] 
**mode** | **str** |  | 
**signed_credential** | [**BoostSendRequestTemplateCredentialAnyOf**](BoostSendRequestTemplateCredentialAnyOf.md) |  | [optional] 
**credential** | [**BoostCreateBoostRequestCredentialAnyOf**](BoostCreateBoostRequestCredentialAnyOf.md) |  | [optional] 
**signing_authority** | [**CredentialRefreshPublishCredentialRefreshRequestSigningAuthority**](CredentialRefreshPublishCredentialRefreshRequestSigningAuthority.md) |  | [optional] 

## Example

```python
from openapi_client.models.credential_refresh_publish_credential_refresh_request import CredentialRefreshPublishCredentialRefreshRequest

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialRefreshPublishCredentialRefreshRequest from a JSON string
credential_refresh_publish_credential_refresh_request_instance = CredentialRefreshPublishCredentialRefreshRequest.from_json(json)
# print the JSON string representation of the object
print(CredentialRefreshPublishCredentialRefreshRequest.to_json())

# convert the object into a dict
credential_refresh_publish_credential_refresh_request_dict = credential_refresh_publish_credential_refresh_request_instance.to_dict()
# create an instance of CredentialRefreshPublishCredentialRefreshRequest from a dict
credential_refresh_publish_credential_refresh_request_from_dict = CredentialRefreshPublishCredentialRefreshRequest.from_dict(credential_refresh_publish_credential_refresh_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


