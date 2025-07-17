# ContactMethodsGetMyContactMethods200ResponseInner


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
from openapi_client.models.contact_methods_get_my_contact_methods200_response_inner import ContactMethodsGetMyContactMethods200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of ContactMethodsGetMyContactMethods200ResponseInner from a JSON string
contact_methods_get_my_contact_methods200_response_inner_instance = ContactMethodsGetMyContactMethods200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(ContactMethodsGetMyContactMethods200ResponseInner.to_json())

# convert the object into a dict
contact_methods_get_my_contact_methods200_response_inner_dict = contact_methods_get_my_contact_methods200_response_inner_instance.to_dict()
# create an instance of ContactMethodsGetMyContactMethods200ResponseInner from a dict
contact_methods_get_my_contact_methods200_response_inner_from_dict = ContactMethodsGetMyContactMethods200ResponseInner.from_dict(contact_methods_get_my_contact_methods200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


