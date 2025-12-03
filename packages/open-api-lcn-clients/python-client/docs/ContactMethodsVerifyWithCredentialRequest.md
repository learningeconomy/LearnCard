# ContactMethodsVerifyWithCredentialRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**proof_of_login_jwt** | **str** |  | 

## Example

```python
from openapi_client.models.contact_methods_verify_with_credential_request import ContactMethodsVerifyWithCredentialRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContactMethodsVerifyWithCredentialRequest from a JSON string
contact_methods_verify_with_credential_request_instance = ContactMethodsVerifyWithCredentialRequest.from_json(json)
# print the JSON string representation of the object
print(ContactMethodsVerifyWithCredentialRequest.to_json())

# convert the object into a dict
contact_methods_verify_with_credential_request_dict = contact_methods_verify_with_credential_request_instance.to_dict()
# create an instance of ContactMethodsVerifyWithCredentialRequest from a dict
contact_methods_verify_with_credential_request_from_dict = ContactMethodsVerifyWithCredentialRequest.from_dict(contact_methods_verify_with_credential_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


