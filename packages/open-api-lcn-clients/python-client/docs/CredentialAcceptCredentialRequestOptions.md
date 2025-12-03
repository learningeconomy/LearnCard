# CredentialAcceptCredentialRequestOptions


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**skip_notification** | **bool** |  | [optional] [default to False]
**metadata** | **Dict[str, object]** |  | [optional] 

## Example

```python
from openapi_client.models.credential_accept_credential_request_options import CredentialAcceptCredentialRequestOptions

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialAcceptCredentialRequestOptions from a JSON string
credential_accept_credential_request_options_instance = CredentialAcceptCredentialRequestOptions.from_json(json)
# print the JSON string representation of the object
print(CredentialAcceptCredentialRequestOptions.to_json())

# convert the object into a dict
credential_accept_credential_request_options_dict = credential_accept_credential_request_options_instance.to_dict()
# create an instance of CredentialAcceptCredentialRequestOptions from a dict
credential_accept_credential_request_options_from_dict = CredentialAcceptCredentialRequestOptions.from_dict(credential_accept_credential_request_options_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


