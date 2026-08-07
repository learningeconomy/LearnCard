# BoostAllocateCredentialStatus200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**type** | **str** |  | 
**status_purpose** | **str** |  | 
**status_list_index** | **str** |  | 
**status_list_credential** | **str** |  | 

## Example

```python
from openapi_client.models.boost_allocate_credential_status200_response_inner import BoostAllocateCredentialStatus200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of BoostAllocateCredentialStatus200ResponseInner from a JSON string
boost_allocate_credential_status200_response_inner_instance = BoostAllocateCredentialStatus200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(BoostAllocateCredentialStatus200ResponseInner.to_json())

# convert the object into a dict
boost_allocate_credential_status200_response_inner_dict = boost_allocate_credential_status200_response_inner_instance.to_dict()
# create an instance of BoostAllocateCredentialStatus200ResponseInner from a dict
boost_allocate_credential_status200_response_inner_from_dict = BoostAllocateCredentialStatus200ResponseInner.from_dict(boost_allocate_credential_status200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


