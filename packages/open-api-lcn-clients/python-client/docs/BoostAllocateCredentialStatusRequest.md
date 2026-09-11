# BoostAllocateCredentialStatusRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**status_purposes** | **List[str]** |  | [optional] 
**list_size** | **int** |  | [optional] 

## Example

```python
from openapi_client.models.boost_allocate_credential_status_request import BoostAllocateCredentialStatusRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostAllocateCredentialStatusRequest from a JSON string
boost_allocate_credential_status_request_instance = BoostAllocateCredentialStatusRequest.from_json(json)
# print the JSON string representation of the object
print(BoostAllocateCredentialStatusRequest.to_json())

# convert the object into a dict
boost_allocate_credential_status_request_dict = boost_allocate_credential_status_request_instance.to_dict()
# create an instance of BoostAllocateCredentialStatusRequest from a dict
boost_allocate_credential_status_request_from_dict = BoostAllocateCredentialStatusRequest.from_dict(boost_allocate_credential_status_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


