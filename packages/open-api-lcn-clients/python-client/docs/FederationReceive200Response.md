# FederationReceive200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**issuance_id** | **str** |  | 
**claim_url** | **str** |  | [optional] 
**status** | **str** |  | 

## Example

```python
from openapi_client.models.federation_receive200_response import FederationReceive200Response

# TODO update the JSON string below
json = "{}"
# create an instance of FederationReceive200Response from a JSON string
federation_receive200_response_instance = FederationReceive200Response.from_json(json)
# print the JSON string representation of the object
print(FederationReceive200Response.to_json())

# convert the object into a dict
federation_receive200_response_dict = federation_receive200_response_instance.to_dict()
# create an instance of FederationReceive200Response from a dict
federation_receive200_response_from_dict = FederationReceive200Response.from_dict(federation_receive200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


