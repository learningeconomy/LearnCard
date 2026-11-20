# IntegrationsSendIntegrationTestEvent200Response

## Properties

| Name            | Type      | Description | Notes      |
| --------------- | --------- | ----------- | ---------- |
| **delivered**   | **bool**  |             |
| **http_status** | **float** |             | [optional] |
| **latency_ms**  | **float** |             | [optional] |
| **error**       | **str**   |             | [optional] |

## Example

```python
from openapi_client.models.integrations_send_integration_test_event200_response import IntegrationsSendIntegrationTestEvent200Response

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsSendIntegrationTestEvent200Response from a JSON string
integrations_send_integration_test_event200_response_instance = IntegrationsSendIntegrationTestEvent200Response.from_json(json)
# print the JSON string representation of the object
print(IntegrationsSendIntegrationTestEvent200Response.to_json())

# convert the object into a dict
integrations_send_integration_test_event200_response_dict = integrations_send_integration_test_event200_response_instance.to_dict()
# create an instance of IntegrationsSendIntegrationTestEvent200Response from a dict
integrations_send_integration_test_event200_response_from_dict = IntegrationsSendIntegrationTestEvent200Response.from_dict(integrations_send_integration_test_event200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
