# ContactMethodsVerifyWithCredential200ResponseContactMethod


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **str** |  | 
**value** | **str** |  | 
**id** | **str** |  | 
**is_verified** | **bool** |  | 
**verified_at** | **str** |  | [optional] 
**is_primary** | **bool** |  | 
**created_at** | **str** |  | 

## Example

```python
from openapi_client.models.contact_methods_verify_with_credential200_response_contact_method import ContactMethodsVerifyWithCredential200ResponseContactMethod

# TODO update the JSON string below
json = "{}"
# create an instance of ContactMethodsVerifyWithCredential200ResponseContactMethod from a JSON string
contact_methods_verify_with_credential200_response_contact_method_instance = ContactMethodsVerifyWithCredential200ResponseContactMethod.from_json(json)
# print the JSON string representation of the object
print(ContactMethodsVerifyWithCredential200ResponseContactMethod.to_json())

# convert the object into a dict
contact_methods_verify_with_credential200_response_contact_method_dict = contact_methods_verify_with_credential200_response_contact_method_instance.to_dict()
# create an instance of ContactMethodsVerifyWithCredential200ResponseContactMethod from a dict
contact_methods_verify_with_credential200_response_contact_method_from_dict = ContactMethodsVerifyWithCredential200ResponseContactMethod.from_dict(contact_methods_verify_with_credential200_response_contact_method_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


