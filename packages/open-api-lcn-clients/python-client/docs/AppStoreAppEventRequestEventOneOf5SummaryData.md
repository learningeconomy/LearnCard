# AppStoreAppEventRequestEventOneOf5SummaryData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **str** | Short, concise title for the learning session or credential | 
**summary** | **str** | Comprehensive summary of what happened during the session | 
**learned** | **List[Optional[str]]** | Bullet points of key knowledge gained | 
**skills** | [**List[AppStoreAppEventRequestEventOneOf5SummaryDataSkillsInner]**](AppStoreAppEventRequestEventOneOf5SummaryDataSkillsInner.md) | Categorized skills learned during the session | 
**next_steps** | [**List[AppStoreAppEventRequestEventOneOf5SummaryDataNextStepsInner]**](AppStoreAppEventRequestEventOneOf5SummaryDataNextStepsInner.md) | Recommended follow-up activities or learning modules | 
**reflections** | [**List[AppStoreAppEventRequestEventOneOf5SummaryDataSkillsInner]**](AppStoreAppEventRequestEventOneOf5SummaryDataSkillsInner.md) | Reflections on the learning experience | 

## Example

```python
from openapi_client.models.app_store_app_event_request_event_one_of5_summary_data import AppStoreAppEventRequestEventOneOf5SummaryData

# TODO update the JSON string below
json = "{}"
# create an instance of AppStoreAppEventRequestEventOneOf5SummaryData from a JSON string
app_store_app_event_request_event_one_of5_summary_data_instance = AppStoreAppEventRequestEventOneOf5SummaryData.from_json(json)
# print the JSON string representation of the object
print(AppStoreAppEventRequestEventOneOf5SummaryData.to_json())

# convert the object into a dict
app_store_app_event_request_event_one_of5_summary_data_dict = app_store_app_event_request_event_one_of5_summary_data_instance.to_dict()
# create an instance of AppStoreAppEventRequestEventOneOf5SummaryData from a dict
app_store_app_event_request_event_one_of5_summary_data_from_dict = AppStoreAppEventRequestEventOneOf5SummaryData.from_dict(app_store_app_event_request_event_one_of5_summary_data_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


