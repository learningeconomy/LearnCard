# CredentialRefreshSendRefreshableCredentialRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**refresh_id** | **str** |  | 
**credential** | [**BoostSendRequestTemplateCredentialAnyOf**](BoostSendRequestTemplateCredentialAnyOf.md) |  | 
**boost_uri** | **str** |  | [optional] 
**skip_notification** | **bool** |  | [optional] 

## Example

```python
from openapi_client.models.credential_refresh_send_refreshable_credential_request import CredentialRefreshSendRefreshableCredentialRequest

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialRefreshSendRefreshableCredentialRequest from a JSON string
credential_refresh_send_refreshable_credential_request_instance = CredentialRefreshSendRefreshableCredentialRequest.from_json(json)
# print the JSON string representation of the object
print(CredentialRefreshSendRefreshableCredentialRequest.to_json())

# convert the object into a dict
credential_refresh_send_refreshable_credential_request_dict = credential_refresh_send_refreshable_credential_request_instance.to_dict()
# create an instance of CredentialRefreshSendRefreshableCredentialRequest from a dict
credential_refresh_send_refreshable_credential_request_from_dict = CredentialRefreshSendRefreshableCredentialRequest.from_dict(credential_refresh_send_refreshable_credential_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


