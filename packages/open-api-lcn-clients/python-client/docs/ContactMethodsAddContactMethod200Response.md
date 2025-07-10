# ContactMethodsAddContactMethod200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**message** | **str** |  | 
**contact_method_id** | **str** |  | 
**verification_required** | **bool** |  | 

## Example

```python
from openapi_client.models.contact_methods_add_contact_method200_response import ContactMethodsAddContactMethod200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ContactMethodsAddContactMethod200Response from a JSON string
contact_methods_add_contact_method200_response_instance = ContactMethodsAddContactMethod200Response.from_json(json)
# print the JSON string representation of the object
print(ContactMethodsAddContactMethod200Response.to_json())

# convert the object into a dict
contact_methods_add_contact_method200_response_dict = contact_methods_add_contact_method200_response_instance.to_dict()
# create an instance of ContactMethodsAddContactMethod200Response from a dict
contact_methods_add_contact_method200_response_from_dict = ContactMethodsAddContactMethod200Response.from_dict(contact_methods_add_contact_method200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


