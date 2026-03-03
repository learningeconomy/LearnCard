# CredentialSendCredentialRequestCredentialAnyOf1


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**protected** | **str** |  | 
**iv** | **str** |  | 
**ciphertext** | **str** |  | 
**tag** | **str** |  | 
**aad** | **str** |  | [optional] 
**recipients** | [**List[CredentialSendCredentialRequestCredentialAnyOf1RecipientsInner]**](CredentialSendCredentialRequestCredentialAnyOf1RecipientsInner.md) |  | [optional] 

## Example

```python
from openapi_client.models.credential_send_credential_request_credential_any_of1 import CredentialSendCredentialRequestCredentialAnyOf1

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialSendCredentialRequestCredentialAnyOf1 from a JSON string
credential_send_credential_request_credential_any_of1_instance = CredentialSendCredentialRequestCredentialAnyOf1.from_json(json)
# print the JSON string representation of the object
print(CredentialSendCredentialRequestCredentialAnyOf1.to_json())

# convert the object into a dict
credential_send_credential_request_credential_any_of1_dict = credential_send_credential_request_credential_any_of1_instance.to_dict()
# create an instance of CredentialSendCredentialRequestCredentialAnyOf1 from a dict
credential_send_credential_request_credential_any_of1_from_dict = CredentialSendCredentialRequestCredentialAnyOf1.from_dict(credential_send_credential_request_credential_any_of1_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


