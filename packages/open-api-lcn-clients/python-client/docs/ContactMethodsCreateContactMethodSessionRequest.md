# ContactMethodsCreateContactMethodSessionRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**contact_method** | [**ContactMethodsCreateContactMethodSessionRequestContactMethod**](ContactMethodsCreateContactMethodSessionRequestContactMethod.md) |  | 
**otp_challenge** | **str** |  | 

## Example

```python
from openapi_client.models.contact_methods_create_contact_method_session_request import ContactMethodsCreateContactMethodSessionRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContactMethodsCreateContactMethodSessionRequest from a JSON string
contact_methods_create_contact_method_session_request_instance = ContactMethodsCreateContactMethodSessionRequest.from_json(json)
# print the JSON string representation of the object
print(ContactMethodsCreateContactMethodSessionRequest.to_json())

# convert the object into a dict
contact_methods_create_contact_method_session_request_dict = contact_methods_create_contact_method_session_request_instance.to_dict()
# create an instance of ContactMethodsCreateContactMethodSessionRequest from a dict
contact_methods_create_contact_method_session_request_from_dict = ContactMethodsCreateContactMethodSessionRequest.from_dict(contact_methods_create_contact_method_session_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


