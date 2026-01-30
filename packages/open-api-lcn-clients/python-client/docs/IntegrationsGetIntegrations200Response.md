# IntegrationsGetIntegrations200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cursor** | **str** |  | [optional] 
**has_more** | **bool** |  | 
**records** | [**List[IntegrationsGetIntegrations200ResponseRecordsInner]**](IntegrationsGetIntegrations200ResponseRecordsInner.md) |  | 

## Example

```python
from openapi_client.models.integrations_get_integrations200_response import IntegrationsGetIntegrations200Response

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsGetIntegrations200Response from a JSON string
integrations_get_integrations200_response_instance = IntegrationsGetIntegrations200Response.from_json(json)
# print the JSON string representation of the object
print(IntegrationsGetIntegrations200Response.to_json())

# convert the object into a dict
integrations_get_integrations200_response_dict = integrations_get_integrations200_response_instance.to_dict()
# create an instance of IntegrationsGetIntegrations200Response from a dict
integrations_get_integrations200_response_from_dict = IntegrationsGetIntegrations200Response.from_dict(integrations_get_integrations200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


