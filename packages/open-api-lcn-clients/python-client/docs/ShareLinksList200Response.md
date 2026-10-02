# ShareLinksList200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cursor** | **str** |  | [optional] 
**has_more** | **bool** |  | 
**records** | [**List[ShareLinksList200ResponseRecordsInner]**](ShareLinksList200ResponseRecordsInner.md) |  | 

## Example

```python
from openapi_client.models.share_links_list200_response import ShareLinksList200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksList200Response from a JSON string
share_links_list200_response_instance = ShareLinksList200Response.from_json(json)
# print the JSON string representation of the object
print(ShareLinksList200Response.to_json())

# convert the object into a dict
share_links_list200_response_dict = share_links_list200_response_instance.to_dict()
# create an instance of ShareLinksList200Response from a dict
share_links_list200_response_from_dict = ShareLinksList200Response.from_dict(share_links_list200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


