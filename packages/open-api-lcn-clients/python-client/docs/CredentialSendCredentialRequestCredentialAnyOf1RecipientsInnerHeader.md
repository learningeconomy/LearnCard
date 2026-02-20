# CredentialSendCredentialRequestCredentialAnyOf1RecipientsInnerHeader


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**alg** | **str** |  | 
**iv** | **str** |  | 
**tag** | **str** |  | 
**epk** | [**CredentialSendCredentialRequestCredentialAnyOf1RecipientsInnerHeaderEpk**](CredentialSendCredentialRequestCredentialAnyOf1RecipientsInnerHeaderEpk.md) |  | [optional] 
**kid** | **str** |  | [optional] 
**apv** | **str** |  | [optional] 
**apu** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.credential_send_credential_request_credential_any_of1_recipients_inner_header import CredentialSendCredentialRequestCredentialAnyOf1RecipientsInnerHeader

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialSendCredentialRequestCredentialAnyOf1RecipientsInnerHeader from a JSON string
credential_send_credential_request_credential_any_of1_recipients_inner_header_instance = CredentialSendCredentialRequestCredentialAnyOf1RecipientsInnerHeader.from_json(json)
# print the JSON string representation of the object
print(CredentialSendCredentialRequestCredentialAnyOf1RecipientsInnerHeader.to_json())

# convert the object into a dict
credential_send_credential_request_credential_any_of1_recipients_inner_header_dict = credential_send_credential_request_credential_any_of1_recipients_inner_header_instance.to_dict()
# create an instance of CredentialSendCredentialRequestCredentialAnyOf1RecipientsInnerHeader from a dict
credential_send_credential_request_credential_any_of1_recipients_inner_header_from_dict = CredentialSendCredentialRequestCredentialAnyOf1RecipientsInnerHeader.from_dict(credential_send_credential_request_credential_any_of1_recipients_inner_header_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


