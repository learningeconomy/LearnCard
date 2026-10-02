# ShareLinksList200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**title** | **str** |  | 
**note** | **str** |  | [optional] 
**selected_count** | **int** |  | 
**version** | **int** |  | 
**content_version** | **int** |  | 
**status** | **str** |  | 
**content_state** | **str** |  | 
**created_at** | **datetime** |  | 
**updated_at** | **datetime** |  | 
**expires_at** | **datetime** |  | 
**stopped_at** | **datetime** |  | 
**last_viewed_at** | **datetime** |  | 
**view_count** | **int** |  | [optional] 
**passcode_protected** | **bool** |  | 
**notify_on_view** | **bool** |  | 
**minor_policy** | [**ShareLinksList200ResponseRecordsInnerMinorPolicy**](ShareLinksList200ResponseRecordsInnerMinorPolicy.md) |  | 
**content_url** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.share_links_list200_response_records_inner import ShareLinksList200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksList200ResponseRecordsInner from a JSON string
share_links_list200_response_records_inner_instance = ShareLinksList200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(ShareLinksList200ResponseRecordsInner.to_json())

# convert the object into a dict
share_links_list200_response_records_inner_dict = share_links_list200_response_records_inner_instance.to_dict()
# create an instance of ShareLinksList200ResponseRecordsInner from a dict
share_links_list200_response_records_inner_from_dict = ShareLinksList200ResponseRecordsInner.from_dict(share_links_list200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


