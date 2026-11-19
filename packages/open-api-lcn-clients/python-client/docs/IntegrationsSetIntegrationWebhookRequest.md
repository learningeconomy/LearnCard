# IntegrationsSetIntegrationWebhookRequest

## Properties

| Name            | Type    | Description | Notes |
| --------------- | ------- | ----------- | ----- |
| **webhook_url** | **str** |             |

## Example

```python
from openapi_client.models.integrations_set_integration_webhook_request import IntegrationsSetIntegrationWebhookRequest

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsSetIntegrationWebhookRequest from a JSON string
integrations_set_integration_webhook_request_instance = IntegrationsSetIntegrationWebhookRequest.from_json(json)
# print the JSON string representation of the object
print(IntegrationsSetIntegrationWebhookRequest.to_json())

# convert the object into a dict
integrations_set_integration_webhook_request_dict = integrations_set_integration_webhook_request_instance.to_dict()
# create an instance of IntegrationsSetIntegrationWebhookRequest from a dict
integrations_set_integration_webhook_request_from_dict = IntegrationsSetIntegrationWebhookRequest.from_dict(integrations_set_integration_webhook_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
