# IntegrationsAddIntegrationRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | 
**description** | **str** |  | [optional] 
**whitelisted_domains** | [**List[IntegrationsAddIntegrationRequestWhitelistedDomainsInner]**](IntegrationsAddIntegrationRequestWhitelistedDomainsInner.md) |  | [optional] [default to []]
**guide_type** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.integrations_add_integration_request import IntegrationsAddIntegrationRequest

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsAddIntegrationRequest from a JSON string
integrations_add_integration_request_instance = IntegrationsAddIntegrationRequest.from_json(json)
# print the JSON string representation of the object
print(IntegrationsAddIntegrationRequest.to_json())

# convert the object into a dict
integrations_add_integration_request_dict = integrations_add_integration_request_instance.to_dict()
# create an instance of IntegrationsAddIntegrationRequest from a dict
integrations_add_integration_request_from_dict = IntegrationsAddIntegrationRequest.from_dict(integrations_add_integration_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


