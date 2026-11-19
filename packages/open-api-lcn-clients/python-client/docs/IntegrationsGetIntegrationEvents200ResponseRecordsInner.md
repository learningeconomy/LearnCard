# IntegrationsGetIntegrationEvents200ResponseRecordsInner

## Properties

| Name                      | Type                                                                                                                                    | Description | Notes      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **event_id**              | **str**                                                                                                                                 |             |
| **delivery_key**          | **str**                                                                                                                                 |             |
| **sequence**              | **int**                                                                                                                                 |             |
| **type**                  | **str**                                                                                                                                 |             |
| **contract_uri**          | **str**                                                                                                                                 |             |
| **terms_uri**             | **str**                                                                                                                                 |             | [optional] |
| **subject**               | [**IntegrationsGetIntegrationEvents200ResponseRecordsInnerSubject**](IntegrationsGetIntegrationEvents200ResponseRecordsInnerSubject.md) |             | [optional] |
| **request_id**            | **str**                                                                                                                                 |             | [optional] |
| **external_reference_id** | **str**                                                                                                                                 |             | [optional] |
| **reason**                | **str**                                                                                                                                 |             | [optional] |
| **category**              | **str**                                                                                                                                 |             | [optional] |
| **role**                  | **str**                                                                                                                                 |             |
| **occurred_at**           | **str**                                                                                                                                 |             |

## Example

```python
from openapi_client.models.integrations_get_integration_events200_response_records_inner import IntegrationsGetIntegrationEvents200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsGetIntegrationEvents200ResponseRecordsInner from a JSON string
integrations_get_integration_events200_response_records_inner_instance = IntegrationsGetIntegrationEvents200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(IntegrationsGetIntegrationEvents200ResponseRecordsInner.to_json())

# convert the object into a dict
integrations_get_integration_events200_response_records_inner_dict = integrations_get_integration_events200_response_records_inner_instance.to_dict()
# create an instance of IntegrationsGetIntegrationEvents200ResponseRecordsInner from a dict
integrations_get_integration_events200_response_records_inner_from_dict = IntegrationsGetIntegrationEvents200ResponseRecordsInner.from_dict(integrations_get_integration_events200_response_records_inner_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
