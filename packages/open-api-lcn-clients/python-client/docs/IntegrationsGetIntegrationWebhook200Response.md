# IntegrationsGetIntegrationWebhook200Response

## Properties

| Name                           | Type     | Description                                                             | Notes      |
| ------------------------------ | -------- | ----------------------------------------------------------------------- | ---------- |
| **webhook_url**                | **str**  |                                                                         |
| **state**                      | **str**  |                                                                         |
| **contract_events_enabled_at** | **str**  |                                                                         | [optional] |
| **has_secret**                 | **bool** |                                                                         |
| **secret_version**             | **int**  | 0 without a secret, 1 for the first secret, plus 1 for every rotation.  |
| **previous_secret_expires_at** | **str**  |                                                                         | [optional] |
| **last_success_at**            | **str**  |                                                                         | [optional] |
| **last_failure_at**            | **str**  |                                                                         | [optional] |
| **last_failure_reason**        | **str**  |                                                                         | [optional] |
| **pending_deliveries**         | **int**  | Feed records waiting for their first delivery attempt.                  |
| **retrying_deliveries**        | **int**  | Feed records that were attempted at least once and will be tried again. |

## Example

```python
from openapi_client.models.integrations_get_integration_webhook200_response import IntegrationsGetIntegrationWebhook200Response

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsGetIntegrationWebhook200Response from a JSON string
integrations_get_integration_webhook200_response_instance = IntegrationsGetIntegrationWebhook200Response.from_json(json)
# print the JSON string representation of the object
print(IntegrationsGetIntegrationWebhook200Response.to_json())

# convert the object into a dict
integrations_get_integration_webhook200_response_dict = integrations_get_integration_webhook200_response_instance.to_dict()
# create an instance of IntegrationsGetIntegrationWebhook200Response from a dict
integrations_get_integration_webhook200_response_from_dict = IntegrationsGetIntegrationWebhook200Response.from_dict(integrations_get_integration_webhook200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
