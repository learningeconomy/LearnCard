# IntegrationsUpdateIntegrationRequestUpdates


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**whitelisted_domains** | [**List[IntegrationsAddIntegrationRequestWhitelistedDomainsInner]**](IntegrationsAddIntegrationRequestWhitelistedDomainsInner.md) |  | [optional] 
**rotate_publishable_key** | **bool** |  | [optional] 
**status** | **str** |  | [optional] 
**guide_type** | **str** |  | [optional] 
**guide_state** | **Dict[str, object]** |  | [optional] 

## Example

```python
from openapi_client.models.integrations_update_integration_request_updates import IntegrationsUpdateIntegrationRequestUpdates

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsUpdateIntegrationRequestUpdates from a JSON string
integrations_update_integration_request_updates_instance = IntegrationsUpdateIntegrationRequestUpdates.from_json(json)
# print the JSON string representation of the object
print(IntegrationsUpdateIntegrationRequestUpdates.to_json())

# convert the object into a dict
integrations_update_integration_request_updates_dict = integrations_update_integration_request_updates_instance.to_dict()
# create an instance of IntegrationsUpdateIntegrationRequestUpdates from a dict
integrations_update_integration_request_updates_from_dict = IntegrationsUpdateIntegrationRequestUpdates.from_dict(integrations_update_integration_request_updates_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


