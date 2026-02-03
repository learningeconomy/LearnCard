# IntegrationsGetIntegrationsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] 
**cursor** | **str** |  | [optional] 
**query** | [**IntegrationsGetIntegrationsRequestQuery**](IntegrationsGetIntegrationsRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.integrations_get_integrations_request import IntegrationsGetIntegrationsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsGetIntegrationsRequest from a JSON string
integrations_get_integrations_request_instance = IntegrationsGetIntegrationsRequest.from_json(json)
# print the JSON string representation of the object
print(IntegrationsGetIntegrationsRequest.to_json())

# convert the object into a dict
integrations_get_integrations_request_dict = integrations_get_integrations_request_instance.to_dict()
# create an instance of IntegrationsGetIntegrationsRequest from a dict
integrations_get_integrations_request_from_dict = IntegrationsGetIntegrationsRequest.from_dict(integrations_get_integrations_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


