# PublicShareLinksContent200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**content_version** | **int** |  | 
**envelope** | [**ShareLinksUpdateRequestEnvelope**](ShareLinksUpdateRequestEnvelope.md) |  | 
**content_url** | **str** |  | 
**receipt** | **str** |  | 

## Example

```python
from openapi_client.models.public_share_links_content200_response import PublicShareLinksContent200Response

# TODO update the JSON string below
json = "{}"
# create an instance of PublicShareLinksContent200Response from a JSON string
public_share_links_content200_response_instance = PublicShareLinksContent200Response.from_json(json)
# print the JSON string representation of the object
print(PublicShareLinksContent200Response.to_json())

# convert the object into a dict
public_share_links_content200_response_dict = public_share_links_content200_response_instance.to_dict()
# create an instance of PublicShareLinksContent200Response from a dict
public_share_links_content200_response_from_dict = PublicShareLinksContent200Response.from_dict(public_share_links_content200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


