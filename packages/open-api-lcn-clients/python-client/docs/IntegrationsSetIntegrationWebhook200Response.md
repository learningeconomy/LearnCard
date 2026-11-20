# IntegrationsSetIntegrationWebhook200Response

## Properties

| Name                           | Type    | Description | Notes      |
| ------------------------------ | ------- | ----------- | ---------- |
| **webhook_url**                | **str** |             |
| **secret**                     | **str** |             | [optional] |
| **contract_events_enabled_at** | **str** |             | [optional] |

## Example

```python
from openapi_client.models.integrations_set_integration_webhook200_response import IntegrationsSetIntegrationWebhook200Response

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsSetIntegrationWebhook200Response from a JSON string
integrations_set_integration_webhook200_response_instance = IntegrationsSetIntegrationWebhook200Response.from_json(json)
# print the JSON string representation of the object
print(IntegrationsSetIntegrationWebhook200Response.to_json())

# convert the object into a dict
integrations_set_integration_webhook200_response_dict = integrations_set_integration_webhook200_response_instance.to_dict()
# create an instance of IntegrationsSetIntegrationWebhook200Response from a dict
integrations_set_integration_webhook200_response_from_dict = IntegrationsSetIntegrationWebhook200Response.from_dict(integrations_set_integration_webhook200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
