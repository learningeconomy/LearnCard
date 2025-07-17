# ContactMethodsAddContactMethodRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**value** | **str** |  | 
**type** | **str** |  | 

## Example

```python
from openapi_client.models.contact_methods_add_contact_method_request import ContactMethodsAddContactMethodRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContactMethodsAddContactMethodRequest from a JSON string
contact_methods_add_contact_method_request_instance = ContactMethodsAddContactMethodRequest.from_json(json)
# print the JSON string representation of the object
print(ContactMethodsAddContactMethodRequest.to_json())

# convert the object into a dict
contact_methods_add_contact_method_request_dict = contact_methods_add_contact_method_request_instance.to_dict()
# create an instance of ContactMethodsAddContactMethodRequest from a dict
contact_methods_add_contact_method_request_from_dict = ContactMethodsAddContactMethodRequest.from_dict(contact_methods_add_contact_method_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


