# ContactMethodsGetMyContactMethods200ResponseInnerOneOf


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
from openapi_client.models.contact_methods_get_my_contact_methods200_response_inner_one_of import ContactMethodsGetMyContactMethods200ResponseInnerOneOf

# TODO update the JSON string below
json = "{}"
# create an instance of ContactMethodsGetMyContactMethods200ResponseInnerOneOf from a JSON string
contact_methods_get_my_contact_methods200_response_inner_one_of_instance = ContactMethodsGetMyContactMethods200ResponseInnerOneOf.from_json(json)
# print the JSON string representation of the object
print(ContactMethodsGetMyContactMethods200ResponseInnerOneOf.to_json())

# convert the object into a dict
contact_methods_get_my_contact_methods200_response_inner_one_of_dict = contact_methods_get_my_contact_methods200_response_inner_one_of_instance.to_dict()
# create an instance of ContactMethodsGetMyContactMethods200ResponseInnerOneOf from a dict
contact_methods_get_my_contact_methods200_response_inner_one_of_from_dict = ContactMethodsGetMyContactMethods200ResponseInnerOneOf.from_dict(contact_methods_get_my_contact_methods200_response_inner_one_of_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


