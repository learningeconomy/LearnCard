# FederationReceiveRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**recipient_did** | **str** |  | 
**credential** | [**ContractsWriteCredentialToContractRequestCredential**](ContractsWriteCredentialToContractRequestCredential.md) |  | 
**issuer_did** | **str** |  | 
**issuer_display_name** | **str** |  | 
**configuration** | [**FederationReceiveRequestConfiguration**](FederationReceiveRequestConfiguration.md) |  | [optional] 

## Example

```python
from openapi_client.models.federation_receive_request import FederationReceiveRequest

# TODO update the JSON string below
json = "{}"
# create an instance of FederationReceiveRequest from a JSON string
federation_receive_request_instance = FederationReceiveRequest.from_json(json)
# print the JSON string representation of the object
print(FederationReceiveRequest.to_json())

# convert the object into a dict
federation_receive_request_dict = federation_receive_request_instance.to_dict()
# create an instance of FederationReceiveRequest from a dict
federation_receive_request_from_dict = FederationReceiveRequest.from_dict(federation_receive_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


