# DidMetadataUpdateDidMetadataRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**updates** | [**DidMetadataAddDidMetadataRequest**](DidMetadataAddDidMetadataRequest.md) |  | 

## Example

```python
from openapi_client.models.did_metadata_update_did_metadata_request import DidMetadataUpdateDidMetadataRequest

# TODO update the JSON string below
json = "{}"
# create an instance of DidMetadataUpdateDidMetadataRequest from a JSON string
did_metadata_update_did_metadata_request_instance = DidMetadataUpdateDidMetadataRequest.from_json(json)
# print the JSON string representation of the object
print(DidMetadataUpdateDidMetadataRequest.to_json())

# convert the object into a dict
did_metadata_update_did_metadata_request_dict = did_metadata_update_did_metadata_request_instance.to_dict()
# create an instance of DidMetadataUpdateDidMetadataRequest from a dict
did_metadata_update_did_metadata_request_from_dict = DidMetadataUpdateDidMetadataRequest.from_dict(did_metadata_update_did_metadata_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


