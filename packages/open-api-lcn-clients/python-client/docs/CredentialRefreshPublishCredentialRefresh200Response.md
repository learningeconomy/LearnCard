# CredentialRefreshPublishCredentialRefresh200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**refresh_id** | **str** |  | 
**version** | **int** |  | 
**published_at** | **str** |  | 
**notification** | **str** |  | 

## Example

```python
from openapi_client.models.credential_refresh_publish_credential_refresh200_response import CredentialRefreshPublishCredentialRefresh200Response

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialRefreshPublishCredentialRefresh200Response from a JSON string
credential_refresh_publish_credential_refresh200_response_instance = CredentialRefreshPublishCredentialRefresh200Response.from_json(json)
# print the JSON string representation of the object
print(CredentialRefreshPublishCredentialRefresh200Response.to_json())

# convert the object into a dict
credential_refresh_publish_credential_refresh200_response_dict = credential_refresh_publish_credential_refresh200_response_instance.to_dict()
# create an instance of CredentialRefreshPublishCredentialRefresh200Response from a dict
credential_refresh_publish_credential_refresh200_response_from_dict = CredentialRefreshPublishCredentialRefresh200Response.from_dict(credential_refresh_publish_credential_refresh200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


