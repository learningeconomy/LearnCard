# CredentialSharePreviewsPublishRequest

## Properties

| Name          | Type     | Description | Notes      |
| ------------- | -------- | ----------- | ---------- |
| **name**      | **str**  |             |
| **issuer**    | **str**  |             |
| **image**     | **str**  |             | [optional] |
| **share_uri** | **str**  |             |
| **id**        | **UUID** |             | [optional] |

## Example

```python
from openapi_client.models.credential_share_previews_publish_request import CredentialSharePreviewsPublishRequest

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialSharePreviewsPublishRequest from a JSON string
credential_share_previews_publish_request_instance = CredentialSharePreviewsPublishRequest.from_json(json)
# print the JSON string representation of the object
print(CredentialSharePreviewsPublishRequest.to_json())

# convert the object into a dict
credential_share_previews_publish_request_dict = credential_share_previews_publish_request_instance.to_dict()
# create an instance of CredentialSharePreviewsPublishRequest from a dict
credential_share_previews_publish_request_from_dict = CredentialSharePreviewsPublishRequest.from_dict(credential_share_previews_publish_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
