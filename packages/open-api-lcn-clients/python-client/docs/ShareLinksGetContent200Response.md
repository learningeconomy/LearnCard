# ShareLinksGetContent200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**content_version** | **int** |  | 
**envelope** | [**ShareLinksUpdateRequestEnvelope**](ShareLinksUpdateRequestEnvelope.md) |  | 

## Example

```python
from openapi_client.models.share_links_get_content200_response import ShareLinksGetContent200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ShareLinksGetContent200Response from a JSON string
share_links_get_content200_response_instance = ShareLinksGetContent200Response.from_json(json)
# print the JSON string representation of the object
print(ShareLinksGetContent200Response.to_json())

# convert the object into a dict
share_links_get_content200_response_dict = share_links_get_content200_response_instance.to_dict()
# create an instance of ShareLinksGetContent200Response from a dict
share_links_get_content200_response_from_dict = ShareLinksGetContent200Response.from_dict(share_links_get_content200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


