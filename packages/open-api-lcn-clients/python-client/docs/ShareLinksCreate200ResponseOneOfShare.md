# ShareLinksCreate200ResponseOneOfShare


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
**minor_policy** | [**ShareLinksCreate200ResponseOneOfShareMinorPolicy**](ShareLinksCreate200ResponseOneOfShareMinorPolicy.md) |  | 
**content_url** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.share_links_create200_response_one_of_share import ShareLinksCreate200ResponseOneOfShare

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksCreate200ResponseOneOfShare from a JSON string
share_links_create200_response_one_of_share_instance = ShareLinksCreate200ResponseOneOfShare.from_json(json)
# print the JSON string representation of the object
print(ShareLinksCreate200ResponseOneOfShare.to_json())

# convert the object into a dict
share_links_create200_response_one_of_share_dict = share_links_create200_response_one_of_share_instance.to_dict()
# create an instance of ShareLinksCreate200ResponseOneOfShare from a dict
share_links_create200_response_one_of_share_from_dict = ShareLinksCreate200ResponseOneOfShare.from_dict(share_links_create200_response_one_of_share_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


