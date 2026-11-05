# CredentialSharePreviewsGet200Response

## Properties

| Name       | Type    | Description | Notes      |
| ---------- | ------- | ----------- | ---------- |
| **name**   | **str** |             |
| **issuer** | **str** |             |
| **image**  | **str** |             | [optional] |

## Example

```python
from openapi_client.models.credential_share_previews_get200_response import CredentialSharePreviewsGet200Response

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialSharePreviewsGet200Response from a JSON string
credential_share_previews_get200_response_instance = CredentialSharePreviewsGet200Response.from_json(json)
# print the JSON string representation of the object
print(CredentialSharePreviewsGet200Response.to_json())

# convert the object into a dict
credential_share_previews_get200_response_dict = credential_share_previews_get200_response_instance.to_dict()
# create an instance of CredentialSharePreviewsGet200Response from a dict
credential_share_previews_get200_response_from_dict = CredentialSharePreviewsGet200Response.from_dict(credential_share_previews_get200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
