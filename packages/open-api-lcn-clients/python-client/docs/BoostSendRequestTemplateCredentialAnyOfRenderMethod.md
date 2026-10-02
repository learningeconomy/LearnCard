# BoostSendRequestTemplateCredentialAnyOfRenderMethod


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **str** |  | 
**render_suite** | **str** |  | 
**template** | **str** |  | 
**render_property** | **List[str]** |  | [optional] 
**output_preference** | [**BoostSendBoostRequestCredentialAnyOfRenderMethodAnyOf1InnerAnyOfOutputPreference**](BoostSendBoostRequestCredentialAnyOfRenderMethodAnyOf1InnerAnyOfOutputPreference.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_send_request_template_credential_any_of_render_method import BoostSendRequestTemplateCredentialAnyOfRenderMethod

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendRequestTemplateCredentialAnyOfRenderMethod from a JSON string
boost_send_request_template_credential_any_of_render_method_instance = BoostSendRequestTemplateCredentialAnyOfRenderMethod.from_json(json)
# print the JSON string representation of the object
print(BoostSendRequestTemplateCredentialAnyOfRenderMethod.to_json())

# convert the object into a dict
boost_send_request_template_credential_any_of_render_method_dict = boost_send_request_template_credential_any_of_render_method_instance.to_dict()
# create an instance of BoostSendRequestTemplateCredentialAnyOfRenderMethod from a dict
boost_send_request_template_credential_any_of_render_method_from_dict = BoostSendRequestTemplateCredentialAnyOfRenderMethod.from_dict(boost_send_request_template_credential_any_of_render_method_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


