# IntegrationsGetIntegration200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**name** | **str** |  | 
**description** | **str** |  | [optional] 
**publishable_key** | **str** |  | 
**whitelisted_domains** | [**List[IntegrationsAddIntegrationRequestWhitelistedDomainsInner]**](IntegrationsAddIntegrationRequestWhitelistedDomainsInner.md) |  | [default to []]
**status** | **str** |  | [default to 'setup']
**guide_type** | **str** |  | [optional] 
**guide_state** | **Dict[str, object]** |  | [optional] 
**created_at** | **str** |  | [optional] 
**updated_at** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.integrations_get_integration200_response import IntegrationsGetIntegration200Response

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsGetIntegration200Response from a JSON string
integrations_get_integration200_response_instance = IntegrationsGetIntegration200Response.from_json(json)
# print the JSON string representation of the object
print(IntegrationsGetIntegration200Response.to_json())

# convert the object into a dict
integrations_get_integration200_response_dict = integrations_get_integration200_response_instance.to_dict()
# create an instance of IntegrationsGetIntegration200Response from a dict
integrations_get_integration200_response_from_dict = IntegrationsGetIntegration200Response.from_dict(integrations_get_integration200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


