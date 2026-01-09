# CredentialSendCredentialRequestCredentialAnyOf1RecipientsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**header** | [**CredentialSendCredentialRequestCredentialAnyOf1RecipientsInnerHeader**](CredentialSendCredentialRequestCredentialAnyOf1RecipientsInnerHeader.md) |  | 
**encrypted_key** | **str** |  | 

## Example

```python
from openapi_client.models.credential_send_credential_request_credential_any_of1_recipients_inner import CredentialSendCredentialRequestCredentialAnyOf1RecipientsInner

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialSendCredentialRequestCredentialAnyOf1RecipientsInner from a JSON string
credential_send_credential_request_credential_any_of1_recipients_inner_instance = CredentialSendCredentialRequestCredentialAnyOf1RecipientsInner.from_json(json)
# print the JSON string representation of the object
print(CredentialSendCredentialRequestCredentialAnyOf1RecipientsInner.to_json())

# convert the object into a dict
credential_send_credential_request_credential_any_of1_recipients_inner_dict = credential_send_credential_request_credential_any_of1_recipients_inner_instance.to_dict()
# create an instance of CredentialSendCredentialRequestCredentialAnyOf1RecipientsInner from a dict
credential_send_credential_request_credential_any_of1_recipients_inner_from_dict = CredentialSendCredentialRequestCredentialAnyOf1RecipientsInner.from_dict(credential_send_credential_request_credential_any_of1_recipients_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


