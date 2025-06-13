# CredentialSendCredentialRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**credential** | [**CredentialSendCredentialRequestCredential**](CredentialSendCredentialRequestCredential.md) |  | 

## Example

```python
from openapi_client.models.credential_send_credential_request import CredentialSendCredentialRequest

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialSendCredentialRequest from a JSON string
credential_send_credential_request_instance = CredentialSendCredentialRequest.from_json(json)
# print the JSON string representation of the object
print(CredentialSendCredentialRequest.to_json())

# convert the object into a dict
credential_send_credential_request_dict = credential_send_credential_request_instance.to_dict()
# create an instance of CredentialSendCredentialRequest from a dict
credential_send_credential_request_from_dict = CredentialSendCredentialRequest.from_dict(credential_send_credential_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


