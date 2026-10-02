# InboxGetBatch200ResponseSummary


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**total** | **float** |  | 
**succeeded** | **float** |  | 
**failed** | **float** |  | 
**deduplicated** | **float** |  | 
**completed** | **float** |  | 
**pending** | **float** |  | 
**unconfirmed** | **float** |  | 

## Example

```python
from openapi_client.models.inbox_get_batch200_response_summary import InboxGetBatch200ResponseSummary

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetBatch200ResponseSummary from a JSON string
inbox_get_batch200_response_summary_instance = InboxGetBatch200ResponseSummary.from_json(json)
# print the JSON string representation of the object
print(InboxGetBatch200ResponseSummary.to_json())

# convert the object into a dict
inbox_get_batch200_response_summary_dict = inbox_get_batch200_response_summary_instance.to_dict()
# create an instance of InboxGetBatch200ResponseSummary from a dict
inbox_get_batch200_response_summary_from_dict = InboxGetBatch200ResponseSummary.from_dict(inbox_get_batch200_response_summary_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


