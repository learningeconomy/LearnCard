# CredentialAcceptCredentialRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**options** | [**BoostSendBoostRequestOptions**](BoostSendBoostRequestOptions.md) |  | [optional] 

## Example

```python
from openapi_client.models.credential_accept_credential_request import CredentialAcceptCredentialRequest

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialAcceptCredentialRequest from a JSON string
credential_accept_credential_request_instance = CredentialAcceptCredentialRequest.from_json(json)
# print the JSON string representation of the object
print(CredentialAcceptCredentialRequest.to_json())

# convert the object into a dict
credential_accept_credential_request_dict = credential_accept_credential_request_instance.to_dict()
# create an instance of CredentialAcceptCredentialRequest from a dict
credential_accept_credential_request_from_dict = CredentialAcceptCredentialRequest.from_dict(credential_accept_credential_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


