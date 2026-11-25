# IntegrationsGetIntegrationEvents200Response

## Properties

| Name              | Type                                                                                                                            | Description | Notes      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **records**       | [**List[IntegrationsGetIntegrationEvents200ResponseRecordsInner]**](IntegrationsGetIntegrationEvents200ResponseRecordsInner.md) |             |
| **cursor**        | **str**                                                                                                                         |             | [optional] |
| **latest_cursor** | **str**                                                                                                                         |             |
| **has_more**      | **bool**                                                                                                                        |             |

## Example

```python
from openapi_client.models.integrations_get_integration_events200_response import IntegrationsGetIntegrationEvents200Response

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsGetIntegrationEvents200Response from a JSON string
integrations_get_integration_events200_response_instance = IntegrationsGetIntegrationEvents200Response.from_json(json)
# print the JSON string representation of the object
print(IntegrationsGetIntegrationEvents200Response.to_json())

# convert the object into a dict
integrations_get_integration_events200_response_dict = integrations_get_integration_events200_response_instance.to_dict()
# create an instance of IntegrationsGetIntegrationEvents200Response from a dict
integrations_get_integration_events200_response_from_dict = IntegrationsGetIntegrationEvents200Response.from_dict(integrations_get_integration_events200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
