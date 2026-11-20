# IntegrationsRotateIntegrationWebhookSecret200Response

## Properties

| Name                           | Type    | Description | Notes      |
| ------------------------------ | ------- | ----------- | ---------- |
| **secret**                     | **str** |             |
| **previous_secret_expires_at** | **str** |             | [optional] |

## Example

```python
from openapi_client.models.integrations_rotate_integration_webhook_secret200_response import IntegrationsRotateIntegrationWebhookSecret200Response

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsRotateIntegrationWebhookSecret200Response from a JSON string
integrations_rotate_integration_webhook_secret200_response_instance = IntegrationsRotateIntegrationWebhookSecret200Response.from_json(json)
# print the JSON string representation of the object
print(IntegrationsRotateIntegrationWebhookSecret200Response.to_json())

# convert the object into a dict
integrations_rotate_integration_webhook_secret200_response_dict = integrations_rotate_integration_webhook_secret200_response_instance.to_dict()
# create an instance of IntegrationsRotateIntegrationWebhookSecret200Response from a dict
integrations_rotate_integration_webhook_secret200_response_from_dict = IntegrationsRotateIntegrationWebhookSecret200Response.from_dict(integrations_rotate_integration_webhook_secret200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
