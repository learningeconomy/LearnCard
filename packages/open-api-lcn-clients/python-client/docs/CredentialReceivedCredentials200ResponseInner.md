# CredentialReceivedCredentials200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**to** | **str** |  | 
**var_from** | **str** |  | 
**sent** | **datetime** |  | 
**received** | **datetime** |  | [optional] 

## Example

```python
from openapi_client.models.credential_received_credentials200_response_inner import CredentialReceivedCredentials200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of CredentialReceivedCredentials200ResponseInner from a JSON string
credential_received_credentials200_response_inner_instance = CredentialReceivedCredentials200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(CredentialReceivedCredentials200ResponseInner.to_json())

# convert the object into a dict
credential_received_credentials200_response_inner_dict = credential_received_credentials200_response_inner_instance.to_dict()
# create an instance of CredentialReceivedCredentials200ResponseInner from a dict
credential_received_credentials200_response_inner_from_dict = CredentialReceivedCredentials200ResponseInner.from_dict(credential_received_credentials200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


