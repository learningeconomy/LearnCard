# FederationGetTrustedServices200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**did** | **str** |  | 
**name** | **str** |  | 
**endpoint** | **str** |  | 

## Example

```python
from openapi_client.models.federation_get_trusted_services200_response_inner import FederationGetTrustedServices200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of FederationGetTrustedServices200ResponseInner from a JSON string
federation_get_trusted_services200_response_inner_instance = FederationGetTrustedServices200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(FederationGetTrustedServices200ResponseInner.to_json())

# convert the object into a dict
federation_get_trusted_services200_response_inner_dict = federation_get_trusted_services200_response_inner_instance.to_dict()
# create an instance of FederationGetTrustedServices200ResponseInner from a dict
federation_get_trusted_services200_response_inner_from_dict = FederationGetTrustedServices200ResponseInner.from_dict(federation_get_trusted_services200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


