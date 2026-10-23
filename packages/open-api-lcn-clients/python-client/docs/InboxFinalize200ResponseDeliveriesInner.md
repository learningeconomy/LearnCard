# InboxFinalize200ResponseDeliveriesInner

## Properties

| Name           | Type                                                                                                            | Description | Notes |
| -------------- | --------------------------------------------------------------------------------------------------------------- | ----------- | ----- |
| **id**         | **str**                                                                                                         |             |
| **credential** | [**InboxFinalize200ResponseVerifiableCredentialsInner**](InboxFinalize200ResponseVerifiableCredentialsInner.md) |             |

## Example

```python
from openapi_client.models.inbox_finalize200_response_deliveries_inner import InboxFinalize200ResponseDeliveriesInner

# TODO update the JSON string below
json = "{}"
# create an instance of InboxFinalize200ResponseDeliveriesInner from a JSON string
inbox_finalize200_response_deliveries_inner_instance = InboxFinalize200ResponseDeliveriesInner.from_json(json)
# print the JSON string representation of the object
print(InboxFinalize200ResponseDeliveriesInner.to_json())

# convert the object into a dict
inbox_finalize200_response_deliveries_inner_dict = inbox_finalize200_response_deliveries_inner_instance.to_dict()
# create an instance of InboxFinalize200ResponseDeliveriesInner from a dict
inbox_finalize200_response_deliveries_inner_from_dict = InboxFinalize200ResponseDeliveriesInner.from_dict(inbox_finalize200_response_deliveries_inner_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
