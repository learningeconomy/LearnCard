# AppStoreAppEventRequestEventAnyOf5SummaryDataNextStepsInner

## Properties

| Name            | Type                                                                                                                                              | Description                                              | Notes      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------- |
| **title**       | **str**                                                                                                                                           | Title of the suggested next step                         |
| **description** | **str**                                                                                                                                           | Description explaining why this next step is recommended |
| **keywords**    | [**AppStoreAppEventRequestEventAnyOf5SummaryDataNextStepsInnerKeywords**](AppStoreAppEventRequestEventAnyOf5SummaryDataNextStepsInnerKeywords.md) |                                                          | [optional] |

## Example

```python
from openapi_client.models.app_store_app_event_request_event_any_of5_summary_data_next_steps_inner import AppStoreAppEventRequestEventAnyOf5SummaryDataNextStepsInner

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAppEventRequestEventAnyOf5SummaryDataNextStepsInner from a JSON string
app_store_app_event_request_event_any_of5_summary_data_next_steps_inner_instance = AppStoreAppEventRequestEventAnyOf5SummaryDataNextStepsInner.from_json(json)
# print the JSON string representation of the object
print(AppStoreAppEventRequestEventAnyOf5SummaryDataNextStepsInner.to_json())

# convert the object into a dict
app_store_app_event_request_event_any_of5_summary_data_next_steps_inner_dict = app_store_app_event_request_event_any_of5_summary_data_next_steps_inner_instance.to_dict()
# create an instance of AppStoreAppEventRequestEventAnyOf5SummaryDataNextStepsInner from a dict
app_store_app_event_request_event_any_of5_summary_data_next_steps_inner_from_dict = AppStoreAppEventRequestEventAnyOf5SummaryDataNextStepsInner.from_dict(app_store_app_event_request_event_any_of5_summary_data_next_steps_inner_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
