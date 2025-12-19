# ContactMethodsVerifyWithCredential200ResponseContactMethodOneOf


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
from openapi_client.models.contact_methods_verify_with_credential200_response_contact_method_one_of import ContactMethodsVerifyWithCredential200ResponseContactMethodOneOf

# TODO update the JSON string below
json = "{}"
# create an instance of ContactMethodsVerifyWithCredential200ResponseContactMethodOneOf from a JSON string
contact_methods_verify_with_credential200_response_contact_method_one_of_instance = ContactMethodsVerifyWithCredential200ResponseContactMethodOneOf.from_json(json)
# print the JSON string representation of the object
print(ContactMethodsVerifyWithCredential200ResponseContactMethodOneOf.to_json())

# convert the object into a dict
contact_methods_verify_with_credential200_response_contact_method_one_of_dict = contact_methods_verify_with_credential200_response_contact_method_one_of_instance.to_dict()
# create an instance of ContactMethodsVerifyWithCredential200ResponseContactMethodOneOf from a dict
contact_methods_verify_with_credential200_response_contact_method_one_of_from_dict = ContactMethodsVerifyWithCredential200ResponseContactMethodOneOf.from_dict(contact_methods_verify_with_credential200_response_contact_method_one_of_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


