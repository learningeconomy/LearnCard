# IntegrationsUpdateIntegrationRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**updates** | [**IntegrationsUpdateIntegrationRequestUpdates**](IntegrationsUpdateIntegrationRequestUpdates.md) |  | 

## Example

```python
from openapi_client.models.integrations_update_integration_request import IntegrationsUpdateIntegrationRequest

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsUpdateIntegrationRequest from a JSON string
integrations_update_integration_request_instance = IntegrationsUpdateIntegrationRequest.from_json(json)
# print the JSON string representation of the object
print(IntegrationsUpdateIntegrationRequest.to_json())

# convert the object into a dict
integrations_update_integration_request_dict = integrations_update_integration_request_instance.to_dict()
# create an instance of IntegrationsUpdateIntegrationRequest from a dict
integrations_update_integration_request_from_dict = IntegrationsUpdateIntegrationRequest.from_dict(integrations_update_integration_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


